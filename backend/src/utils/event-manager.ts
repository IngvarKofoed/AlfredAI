import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as cron from 'node-cron';
import { v4 as uuidv4 } from 'uuid';
import { EventTrigger, EventSource, EventAction, EventLog, EventStats } from '../types/event';

export class EventManager extends EventEmitter {
  private events: Map<string, EventTrigger> = new Map();
  private eventLogs: EventLog[] = [];
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private configPath: string;
  private logsPath: string;

  constructor(configDir: string = './') {
    super();
    this.configPath = path.join(configDir, 'ai-events.json');
    this.logsPath = path.join(configDir, 'ai-event-logs.json');
  }

  async initialize(): Promise<void> {
    await this.loadEvents();
    await this.loadEventLogs();
    this.startScheduledEvents();
    console.log('Event manager initialized');
  }

  // Event Management
  async createEvent(event: Omit<EventTrigger, 'id' | 'triggerCount' | 'createdAt' | 'updatedAt'>): Promise<EventTrigger> {
    const newEvent: EventTrigger = {
      ...event,
      id: uuidv4(),
      triggerCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.events.set(newEvent.id, newEvent);
    await this.saveEvents();

    if (newEvent.enabled && newEvent.eventSource.type === 'timer') {
      this.scheduleTimerEvent(newEvent);
    }

    this.emit('eventCreated', newEvent);
    return newEvent;
  }

  async updateEvent(id: string, updates: Partial<EventTrigger>): Promise<EventTrigger | null> {
    const event = this.events.get(id);
    if (!event) return null;

    const updatedEvent = {
      ...event,
      ...updates,
      id, // Preserve ID
      updatedAt: new Date()
    };

    this.events.set(id, updatedEvent);
    await this.saveEvents();

    // Update scheduling if needed
    if (updatedEvent.eventSource.type === 'timer') {
      this.unscheduleEvent(id);
      if (updatedEvent.enabled) {
        this.scheduleTimerEvent(updatedEvent);
      }
    }

    this.emit('eventUpdated', updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: string): Promise<boolean> {
    const event = this.events.get(id);
    if (!event) return false;

    this.events.delete(id);
    this.unscheduleEvent(id);
    await this.saveEvents();

    this.emit('eventDeleted', id);
    return true;
  }

  getEvent(id: string): EventTrigger | undefined {
    return this.events.get(id);
  }

  getAllEvents(): EventTrigger[] {
    return Array.from(this.events.values());
  }

  getActiveEvents(): EventTrigger[] {
    return this.getAllEvents().filter(event => event.enabled);
  }

  // Event Triggering
  async triggerEvent(eventId: string, context: Record<string, any> = {}): Promise<void> {
    const event = this.events.get(eventId);
    if (!event || !event.enabled) return;

    // Check cooldown
    if (event.cooldown && event.lastTriggered) {
      const cooldownMs = event.cooldown * 60 * 1000;
      const timeSinceLastTrigger = Date.now() - event.lastTriggered.getTime();
      if (timeSinceLastTrigger < cooldownMs) {
        console.log(`Event ${event.name} is in cooldown period`);
        return;
      }
    }

    // Check conditions
    if (!this.evaluateConditions(event, context)) {
      console.log(`Event ${event.name} conditions not met`);
      return;
    }

    try {
      // Execute actions
      for (const action of event.actions) {
        await this.executeAction(action, event, context);
      }

      // Update event stats
      event.triggerCount++;
      event.lastTriggered = new Date();
      await this.updateEvent(eventId, event);

      // Log the event
      await this.logEvent(event, event.actions, true, 'Event triggered successfully');

      this.emit('eventTriggered', event, context);
      console.log(`Event '${event.name}' triggered successfully`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.logEvent(event, event.actions, false, errorMessage);
      console.error(`Error triggering event '${event.name}':`, error);
    }
  }

  // Specific event types
  async handleCLIConnection(clientId: string): Promise<void> {
    const cliEvents = this.getAllEvents().filter(
      event => event.enabled && event.eventSource.type === 'cli-connection'
    );

    for (const event of cliEvents) {
      await this.triggerEvent(event.id, { clientId, connectionTime: new Date() });
    }
  }

  // Private methods
  private evaluateConditions(event: EventTrigger, context: Record<string, any>): boolean {
    // For now, simple implementation - can be expanded
    for (const condition of event.conditions) {
      if (condition.type === 'always') {
        continue; // Always passes
      }
      if (condition.type === 'time-range') {
        const now = new Date();
        const hour = now.getHours();
        const startHour = condition.config.startHour || 0;
        const endHour = condition.config.endHour || 23;
        if (hour < startHour || hour > endHour) {
          return false;
        }
      }
      // Add more condition types as needed
    }
    return true;
  }

  private async executeAction(action: EventAction, event: EventTrigger, context: Record<string, any>): Promise<void> {
    switch (action.type) {
      case 'notify':
        this.emit('notification', {
          eventName: event.name,
          message: action.config.message || `Event '${event.name}' triggered`,
          context
        });
        break;

      case 'send-message':
        this.emit('sendMessage', {
          message: action.config.message || `Event '${event.name}' triggered`,
          autonomous: action.config.autonomous || false,
          context
        });
        break;

      case 'execute-tool':
        if (action.config.tool) {
          this.emit('executeTool', {
            tool: action.config.tool,
            params: action.config.params || {},
            autonomous: action.config.autonomous || false,
            context
          });
        }
        break;

      case 'ai-response':
        this.emit('aiResponse', {
          prompt: action.config.aiPrompt || `Respond to event: ${event.name}`,
          autonomous: action.config.autonomous || false,
          context
        });
        break;

      case 'run-command':
        if (action.config.command) {
          this.emit('runCommand', {
            command: action.config.command,
            autonomous: action.config.autonomous || false,
            context
          });
        }
        break;
    }
  }

  private scheduleTimerEvent(event: EventTrigger): void {
    const cronExpression = event.eventSource.config.cronExpression;
    if (!cronExpression || !cron.validate(cronExpression)) {
      console.error(`Invalid cron expression for event '${event.name}': ${cronExpression}`);
      return;
    }

    const task = cron.schedule(cronExpression, async () => {
      await this.triggerEvent(event.id, { scheduledTime: new Date() });
    });

    this.scheduledTasks.set(event.id, task);
    console.log(`Scheduled timer event '${event.name}' with expression: ${cronExpression}`);
  }

  private unscheduleEvent(eventId: string): void {
    const task = this.scheduledTasks.get(eventId);
    if (task) {
      task.stop();
      this.scheduledTasks.delete(eventId);
    }
  }

  private startScheduledEvents(): void {
    const timerEvents = this.getAllEvents().filter(
      event => event.enabled && event.eventSource.type === 'timer'
    );

    for (const event of timerEvents) {
      this.scheduleTimerEvent(event);
    }
  }

  // Persistence
  private async loadEvents(): Promise<void> {
    try {
      const data = await fs.readFile(this.configPath, 'utf-8');
      const eventsData = JSON.parse(data);
      
      for (const eventData of eventsData.events || []) {
        // Convert date strings back to Date objects
        eventData.createdAt = new Date(eventData.createdAt);
        eventData.updatedAt = new Date(eventData.updatedAt);
        if (eventData.lastTriggered) {
          eventData.lastTriggered = new Date(eventData.lastTriggered);
        }
        
        this.events.set(eventData.id, eventData);
      }
      
      console.log(`Loaded ${this.events.size} events from ${this.configPath}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error loading events:', error);
      }
    }
  }

  private async saveEvents(): Promise<void> {
    try {
      const eventsData = {
        events: Array.from(this.events.values())
      };
      
      await fs.writeFile(this.configPath, JSON.stringify(eventsData, null, 2));
    } catch (error) {
      console.error('Error saving events:', error);
    }
  }

  private async loadEventLogs(): Promise<void> {
    try {
      const data = await fs.readFile(this.logsPath, 'utf-8');
      const logsData = JSON.parse(data);
      
      this.eventLogs = (logsData.logs || []).map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
      
      // Keep only recent logs (last 1000)
      this.eventLogs = this.eventLogs.slice(-1000);
      
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error loading event logs:', error);
      }
    }
  }

  private async saveEventLogs(): Promise<void> {
    try {
      const logsData = {
        logs: this.eventLogs.slice(-1000) // Keep only recent logs
      };
      
      await fs.writeFile(this.logsPath, JSON.stringify(logsData, null, 2));
    } catch (error) {
      console.error('Error saving event logs:', error);
    }
  }

  private async logEvent(event: EventTrigger, actions: EventAction[], success: boolean, details: string): Promise<void> {
    const log: EventLog = {
      id: uuidv4(),
      eventTriggerId: event.id,
      timestamp: new Date(),
      source: event.eventSource,
      actions,
      success,
      details
    };

    this.eventLogs.push(log);
    await this.saveEventLogs();
  }

  // Statistics
  getEventStats(): EventStats {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return {
      totalEvents: this.events.size,
      recentEvents: this.eventLogs.filter(log => log.timestamp > yesterday).length,
      activeEvents: this.getActiveEvents().length,
      pendingEvents: 0 // Can be implemented for scheduled events
    };
  }

  getRecentEventLogs(limit: number = 10): EventLog[] {
    return this.eventLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }
} 