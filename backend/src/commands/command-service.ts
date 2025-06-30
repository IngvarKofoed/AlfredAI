import { Command } from './command';
import { logger } from '../utils/logger';

/**
 * Service for managing and executing commands.
 * 
 * This service provides a centralized way to register, retrieve, and execute
 * commands throughout the application. Commands are stored in memory and
 * can be executed by their unique name.
 */
export class CommandService {
    private commands: Map<string, Command> = new Map();

    constructor() {
        logger.debug('CommandService initialized');
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
    public async executeCommand(commandName: string, args?: Record<string, any>): Promise<void> {
        const command = this.commands.get(commandName);
        
        if (!command) {
            const error = `Command '${commandName}' not found`;
            logger.error(error);
            throw new Error(error);
        }

        try {
            logger.debug(`Executing command: ${commandName}`, { args });
            await command.execute(args);
            logger.debug(`Command executed successfully: ${commandName}`);
        } catch (error) {
            logger.error(`Failed to execute command '${commandName}':`, error);
            throw error;
        }
    }
}
