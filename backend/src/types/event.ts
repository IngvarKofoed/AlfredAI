export interface EventTrigger {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  eventSource: EventSource;
  conditions: EventCondition[];
  actions: EventAction[];
  cooldown?: number; // Minutes to wait before triggering again
  lastTriggered?: Date;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EventSource {
  type: EventSourceType;
  config: Record<string, any>;
}

export type EventSourceType = 
  | 'cli-connection'
  | 'timer'
  | 'webhook'
  | 'file-change'
  | 'custom';

export interface EventCondition {
  type: 'always' | 'time-range' | 'cooldown' | 'custom';
  config: Record<string, any>;
}

export interface EventAction {
  type: EventActionType;
  config: EventActionConfig;
}

export type EventActionType = 
  | 'notify'
  | 'execute-tool'
  | 'send-message'
  | 'run-command'
  | 'ai-response';

export interface EventActionConfig {
  message?: string;
  tool?: string;
  params?: Record<string, any>;
  command?: string;
  aiPrompt?: string;
  autonomous?: boolean; // If true, AI can act without user confirmation
}

export interface EventLog {
  id: string;
  eventTriggerId: string;
  timestamp: Date;
  source: EventSource;
  actions: EventAction[];
  success: boolean;
  details: string;
}

export interface EventStats {
  totalEvents: number;
  recentEvents: number; // Last 24 hours
  activeEvents: number;
  pendingEvents: number;
} 