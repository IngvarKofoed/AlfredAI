import { Command } from '../types/command';
import { logger } from '../utils/logger';
import { HelpCommand } from './help-command';
import { ProviderCommand } from '../tools/personality/provider-command';
import { StatusCommand } from './status-command';
import { HistoryCommand } from './history-command';
import { Service } from '../types/service';

/**
 * Service for managing and executing commands.
 * 
 * This service provides a centralized way to register, retrieve, and execute
 * commands throughout the application. Commands are stored in memory and
 * can be executed by their unique name.
 */
export class CommandService implements Service {
    private commands: Map<string, Command> = new Map();

    constructor() {
        logger.debug('CommandService initialized');
        
        this.registerCommand(new HelpCommand());
        this.registerCommand(new StatusCommand());
        this.registerCommand(new HistoryCommand());
    }

    async initialize(): Promise<void> {
        // Empty implementation - no initialization needed
    }

    async close(): Promise<void> {
        // Empty implementation - no cleanup needed
    }

    /**
     * Register a command with the service.
     * 
     * @param command - The command instance to register.
     * @throws Error if a command with the same name is already registered.
     */
    public registerCommand(command: Command): void {
        if (this.commands.has(command.name)) {
            const error = `Command '${command.name}' is already registered`;
            logger.error(error);
            throw new Error(error);
        }

        this.commands.set(command.name, command);
        logger.debug(`Command registered: ${command.name}`);
    }

    /**
     * Get all registered commands.
     * 
     * @returns An array of all registered Command instances.
     */
    public getAllCommands(): Command[] {
        return Array.from(this.commands.values());
    }

    /**
     * Execute a command by its name.
     * 
     * @param commandName - The unique name of the command to execute.
     * @param args - Optional arguments to pass to the command.
     * @returns A promise that resolves when the command execution is complete.
     * @throws Error if the command is not found or execution fails.
     */
    public async executeCommand(commandName: string, args?: Record<string, any>): Promise<string> {
        const command = this.commands.get(commandName);
            
        if (!command) {
            return `❌ Unknown command: ${commandName}

Type /help to see available commands.`;
        }

        try {
            logger.debug(`Executing command: ${commandName}`, { args });
            const result = await command.execute(args);
            logger.debug(`Command executed successfully: ${commandName}`);
            return result;
        } catch (error) {
            logger.error(`Failed to execute command '${commandName}':`, error);
            throw error;
        }
    }
}
