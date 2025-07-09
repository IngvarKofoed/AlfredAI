import { EventEmitter } from 'events';
import { Service } from '../types/service';

export interface SubAgentEventData {
    id: string;
    prompt: string;
    status: 'started' | 'completed' | 'failed';
    startTime: number;
    endTime?: number;
    result?: string;
    error?: string;
}

export class SubAgentEventService extends EventEmitter implements Service {
    constructor() {
        super();
    }

    public async initialize(): Promise<void> {
        // No specific initialization needed for event service
    }

    public async close(): Promise<void> {
        // Remove all listeners and clean up
        this.removeAllListeners();
    }

    public emitSubAgentStarted(data: SubAgentEventData): void {
        this.emit('subAgentStarted', data);
    }

    public emitSubAgentCompleted(data: SubAgentEventData): void {
        this.emit('subAgentCompleted', data);
    }

    public emitSubAgentFailed(data: SubAgentEventData): void {
        this.emit('subAgentFailed', data);
    }

    public onSubAgentStarted(listener: (data: SubAgentEventData) => void): void {
        this.on('subAgentStarted', listener);
    }

    public onSubAgentCompleted(listener: (data: SubAgentEventData) => void): void {
        this.on('subAgentCompleted', listener);
    }

    public onSubAgentFailed(listener: (data: SubAgentEventData) => void): void {
        this.on('subAgentFailed', listener);
    }

    public removeAllListeners(): this {
        super.removeAllListeners();
        return this;
    }
} 