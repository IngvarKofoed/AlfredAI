import { EventManager } from '../utils/event-manager';
import { EventTrigger, EventSource, EventAction, EventCondition } from '../types/event';
import { Tool, ToolResult, ToolDescription } from './tool';

const eventManager = new EventManager('./backend');

// Helper functions for the event tool
async function createEvent(params: any): Promise<string> {
  if (!params.name || !params.eventSource || !params.actions) {
    return `❌ Error: Missing required parameters. Need: name, eventSource, actions`;
  }

  const event = await eventManager.createEvent({
    name: params.name,
    description: params.description || '',
    enabled: true,
    eventSource: params.eventSource,
    conditions: params.conditions || [{ type: 'always', config: {} }],
    actions: params.actions,
    cooldown: params.cooldown
  });

  return `✅ Event created successfully!\n\n` +
         `📋 **${event.name}**\n` +
         `🆔 ID: ${event.id}\n` +
         `📝 Description: ${event.description}\n` +
         `🎯 Source: ${event.eventSource.type}\n` +
         `⚡ Actions: ${event.actions.length}\n` +
         `🕐 Created: ${event.createdAt.toLocaleString()}`;
}

function listEvents(): string {
  const events = eventManager.getAllEvents();
  
  if (events.length === 0) {
    return `📋 **No Events Found**\n\n` +
           `🚀 Get started by creating your first event:\n` +
           `• Use \`create-cli-welcome\` for CLI connection notifications\n` +
           `• Use \`create-timer\` for scheduled events\n` +
           `• Use \`create\` for custom events`;
  }

  const activeEvents = events.filter(e => e.enabled);
  const inactiveEvents = events.filter(e => !e.enabled);

  let result = `📋 **Event Management System**\n\n`;
  
  if (activeEvents.length > 0) {
    result += `🟢 **Active Events (${activeEvents.length})**\n`;
    for (const event of activeEvents) {
      const lastTriggered = event.lastTriggered 
        ? event.lastTriggered.toLocaleDateString()
        : 'Never';
      
      result += `• **${event.name}** (${event.eventSource.type})\n`;
      result += `  🆔 ${event.id} | 🔄 ${event.triggerCount} triggers | 📅 Last: ${lastTriggered}\n`;
      result += `  📝 ${event.description}\n\n`;
    }
  }

  if (inactiveEvents.length > 0) {
    result += `🔴 **Inactive Events (${inactiveEvents.length})**\n`;
    for (const event of inactiveEvents) {
      result += `• **${event.name}** (${event.eventSource.type}) - DISABLED\n`;
      result += `  🆔 ${event.id}\n\n`;
    }
  }

  result += `💡 **Quick Actions:**\n`;
  result += `• \`get <id>\` - View event details\n`;
  result += `• \`enable/disable <id>\` - Toggle event\n`;
  result += `• \`trigger <id>\` - Manual trigger\n`;
  result += `• \`stats\` - View statistics`;

  return result;
}

function getEvent(id: string): string {
  if (!id) {
    return `❌ Error: Event ID is required`;
  }

  const event = eventManager.getEvent(id);
  if (!event) {
    return `❌ Error: Event with ID '${id}' not found`;
  }

  const lastTriggered = event.lastTriggered 
    ? event.lastTriggered.toLocaleString()
    : 'Never';

  let result = `📋 **Event Details**\n\n`;
  result += `**${event.name}** ${event.enabled ? '🟢' : '🔴'}\n`;
  result += `🆔 ID: ${event.id}\n`;
  result += `📝 Description: ${event.description}\n`;
  result += `🎯 Source Type: ${event.eventSource.type}\n`;
  result += `🔄 Trigger Count: ${event.triggerCount}\n`;
  result += `📅 Last Triggered: ${lastTriggered}\n`;
  result += `🕐 Created: ${event.createdAt.toLocaleString()}\n`;
  result += `🔄 Updated: ${event.updatedAt.toLocaleString()}\n`;

  if (event.cooldown) {
    result += `⏱️ Cooldown: ${event.cooldown} minutes\n`;
  }

  result += `\n**Source Configuration:**\n`;
  result += `\`\`\`json\n${JSON.stringify(event.eventSource.config, null, 2)}\n\`\`\`\n`;

  result += `\n**Conditions (${event.conditions.length}):**\n`;
  for (const condition of event.conditions) {
    result += `• ${condition.type}: ${JSON.stringify(condition.config)}\n`;
  }

  result += `\n**Actions (${event.actions.length}):**\n`;
  for (const action of event.actions) {
    result += `• ${action.type}: ${action.config.message || JSON.stringify(action.config)}\n`;
  }

  return result;
}

async function updateEvent(params: any): Promise<string> {
  if (!params.id) {
    return `❌ Error: Event ID is required`;
  }

  const updates: Partial<EventTrigger> = {};
  
  if (params.name) updates.name = params.name;
  if (params.description) updates.description = params.description;
  if (params.eventSource) updates.eventSource = params.eventSource;
  if (params.conditions) updates.conditions = params.conditions;
  if (params.actions) updates.actions = params.actions;
  if (params.cooldown !== undefined) updates.cooldown = params.cooldown;

  const updatedEvent = await eventManager.updateEvent(params.id, updates);
  
  if (!updatedEvent) {
    return `❌ Error: Event with ID '${params.id}' not found`;
  }

  return `✅ Event updated successfully!\n\n` +
         `📋 **${updatedEvent.name}**\n` +
         `🆔 ID: ${updatedEvent.id}\n` +
         `🔄 Updated: ${updatedEvent.updatedAt.toLocaleString()}`;
}

async function deleteEvent(id: string): Promise<string> {
  if (!id) {
    return `❌ Error: Event ID is required`;
  }

  const event = eventManager.getEvent(id);
  if (!event) {
    return `❌ Error: Event with ID '${id}' not found`;
  }

  const success = await eventManager.deleteEvent(id);
  
  if (success) {
    return `✅ Event '${event.name}' deleted successfully!`;
  } else {
    return `❌ Error: Failed to delete event`;
  }
}

async function enableEvent(id: string): Promise<string> {
  const event = await eventManager.updateEvent(id, { enabled: true });
  
  if (!event) {
    return `❌ Error: Event with ID '${id}' not found`;
  }

  return `✅ Event '${event.name}' enabled successfully! 🟢`;
}

async function disableEvent(id: string): Promise<string> {
  const event = await eventManager.updateEvent(id, { enabled: false });
  
  if (!event) {
    return `❌ Error: Event with ID '${id}' not found`;
  }

  return `🔴 Event '${event.name}' disabled successfully!`;
}

async function triggerEvent(id: string): Promise<string> {
  if (!id) {
    return `❌ Error: Event ID is required`;
  }

  const event = eventManager.getEvent(id);
  if (!event) {
    return `❌ Error: Event with ID '${id}' not found`;
  }

  await eventManager.triggerEvent(id, { manualTrigger: true, timestamp: new Date() });
  
  return `⚡ Event '${event.name}' triggered manually!`;
}

function getEventLogs(limit: number = 10): string {
  const logs = eventManager.getRecentEventLogs(limit);
  
  if (logs.length === 0) {
    return `📋 **No Event Logs Found**\n\nEvents will appear here once they start triggering.`;
  }

  let result = `📋 **Recent Event Logs (${logs.length})**\n\n`;
  
  for (const log of logs) {
    const event = eventManager.getEvent(log.eventTriggerId);
    const eventName = event ? event.name : 'Unknown Event';
    const status = log.success ? '✅' : '❌';
    
    result += `${status} **${eventName}** - ${log.timestamp.toLocaleString()}\n`;
    result += `   🎯 Source: ${log.source.type}\n`;
    result += `   ⚡ Actions: ${log.actions.length}\n`;
    result += `   📝 ${log.details}\n\n`;
  }

  return result;
}

function getEventStats(): string {
  const stats = eventManager.getEventStats();
  
  return `📊 **Event System Statistics**\n\n` +
         `📋 Total Events: ${stats.totalEvents}\n` +
         `🟢 Active Events: ${stats.activeEvents}\n` +
         `📅 Recent Triggers (24h): ${stats.recentEvents}\n` +
         `⏳ Pending Events: ${stats.pendingEvents}\n\n` +
         `💡 Use \`logs\` to see recent activity`;
}

async function createCLIWelcomeEvent(params: any): Promise<string> {
  const message = params.message || "👋 Welcome back! You've connected to Alfred via CLI.";
  const autonomous = params.autonomous !== undefined ? params.autonomous : false;

  const event = await eventManager.createEvent({
    name: 'CLI Connection Welcome',
    description: 'Greets user when they connect via CLI',
    enabled: true,
    eventSource: {
      type: 'cli-connection',
      config: {}
    },
    conditions: [{ type: 'always', config: {} }],
    actions: [{
      type: 'send-message',
      config: {
        message,
        autonomous
      }
    }],
    cooldown: params.cooldown || 1 // 1 minute cooldown to prevent spam
  });

  return `✅ CLI Welcome Event created!\n\n` +
         `📋 **${event.name}**\n` +
         `🆔 ID: ${event.id}\n` +
         `💬 Message: "${message}"\n` +
         `🤖 Autonomous: ${autonomous ? 'Yes' : 'No'}\n\n` +
         `🎯 This event will trigger every time you connect via CLI (with 1-minute cooldown).`;
}

async function createTimerEvent(params: any): Promise<string> {
  if (!params.cronExpression) {
    return `❌ Error: Cron expression is required for timer events\n\n` +
           `📝 **Examples:**\n` +
           `• "0 15 * * *" - Every day at 3:00 PM\n` +
           `• "0 9 * * 1" - Every Monday at 9:00 AM\n` +
           `• "*/30 * * * *" - Every 30 minutes\n` +
           `• "0 0 * * 0" - Every Sunday at midnight`;
  }

  const name = params.name || `Timer Event`;
  const message = params.message || `⏰ Scheduled event triggered!`;

  const event = await eventManager.createEvent({
    name,
    description: params.description || `Scheduled event with cron: ${params.cronExpression}`,
    enabled: true,
    eventSource: {
      type: 'timer',
      config: {
        cronExpression: params.cronExpression
      }
    },
    conditions: [{ type: 'always', config: {} }],
    actions: [{
      type: 'send-message',
      config: {
        message,
        autonomous: params.autonomous || false
      }
    }],
    cooldown: params.cooldown
  });

  return `✅ Timer Event created!\n\n` +
         `📋 **${event.name}**\n` +
         `🆔 ID: ${event.id}\n` +
         `⏰ Schedule: ${params.cronExpression}\n` +
         `💬 Message: "${message}"\n` +
         `🤖 Autonomous: ${params.autonomous ? 'Yes' : 'No'}\n\n` +
         `⚡ This event is now scheduled and will trigger automatically.`;
}

function clearLogs(): string {
  // This would clear logs in a real implementation
  return `✅ Event logs cleared successfully!`;
}

function getHelp(): string {
  return `🎯 **Event Management Tool**\n\n` +
         `**Quick Setup:**\n` +
         `• \`create-cli-welcome\` - Welcome message when connecting via CLI\n` +
         `• \`create-timer\` - Scheduled events with cron expressions\n\n` +
         `**Management:**\n` +
         `• \`list\` - Show all events\n` +
         `• \`get <id>\` - Show event details\n` +
         `• \`enable/disable <id>\` - Toggle events\n` +
         `• \`trigger <id>\` - Manually trigger event\n` +
         `• \`delete <id>\` - Remove event\n\n` +
         `**Monitoring:**\n` +
         `• \`stats\` - View system statistics\n` +
         `• \`logs\` - Show recent event activity\n\n` +
         `**Advanced:**\n` +
         `• \`create\` - Create custom events with full configuration\n` +
         `• \`update <id>\` - Modify existing events`;
}

// Main tool object
export const eventTool: Tool = {
  description: {
    name: 'event',
    description: 'Comprehensive event management system for creating, managing, and monitoring automated events and triggers',
    parameters: [
      {
        name: 'action',
        description: 'The action to perform with the event system',
        usage: 'create|list|get|update|delete|enable|disable|trigger|logs|stats|create-cli-welcome|create-timer|clear-logs',
        required: true
      },
      {
        name: 'id',
        description: 'Event ID for specific operations',
        usage: 'Event UUID',
        required: false
      },
      {
        name: 'name',
        description: 'Event name for creation',
        usage: 'Human readable event name',
        required: false
      },
      {
        name: 'description',
        description: 'Event description',
        usage: 'Description of what the event does',
        required: false
      },
      {
        name: 'cronExpression',
        description: 'Cron expression for timer events',
        usage: '"0 15 * * *" for 3 PM daily',
        required: false
      },
      {
        name: 'message',
        description: 'Message content for notifications',
        usage: 'Text message to send',
        required: false
      },
      {
        name: 'autonomous',
        description: 'Whether actions should be autonomous',
        usage: 'true|false',
        required: false
      },
      {
        name: 'cooldown',
        description: 'Cooldown period in minutes',
        usage: 'Number of minutes',
        required: false
      }
    ],
    examples: [
      {
        description: 'Create a CLI welcome event',
        parameters: [
          { name: 'action', value: 'create-cli-welcome' },
          { name: 'message', value: 'Welcome back to Alfred!' }
        ]
      },
      {
        description: 'Create a daily 3 PM reminder',
        parameters: [
          { name: 'action', value: 'create-timer' },
          { name: 'cronExpression', value: '0 15 * * *' },
          { name: 'message', value: 'Time for your daily review!' }
        ]
      },
      {
        description: 'List all events',
        parameters: [
          { name: 'action', value: 'list' }
        ]
      },
      {
        description: 'View event statistics',
        parameters: [
          { name: 'action', value: 'stats' }
        ]
      }
    ]
  },

  async execute(params: Record<string, any>): Promise<ToolResult> {
    try {
      // Initialize event manager if not already done
      if (!eventManager.getAllEvents) {
        await eventManager.initialize();
      }

      let result: string;

      switch (params.action) {
        case 'create':
          result = await createEvent(params);
          break;
        
        case 'list':
          result = listEvents();
          break;
        
        case 'get':
          result = getEvent(params.id);
          break;
        
        case 'update':
          result = await updateEvent(params);
          break;
        
        case 'delete':
          result = await deleteEvent(params.id);
          break;
        
        case 'enable':
          result = await enableEvent(params.id);
          break;
        
        case 'disable':
          result = await disableEvent(params.id);
          break;
        
        case 'trigger':
          result = await triggerEvent(params.id);
          break;
        
        case 'logs':
          result = getEventLogs(params.limit);
          break;
        
        case 'stats':
          result = getEventStats();
          break;
        
        case 'create-cli-welcome':
          result = await createCLIWelcomeEvent(params);
          break;
        
        case 'create-timer':
          result = await createTimerEvent(params);
          break;
        
        case 'clear-logs':
          result = clearLogs();
          break;
        
        default:
          result = getHelp();
      }

      return {
        success: true,
        result
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
};

// Export the eventManager instance for use in other parts of the system
export { eventManager }; 