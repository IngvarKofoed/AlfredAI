import { Command, CommandSchema } from '../types/command';
import { logger } from '../utils/logger';
import { HelpCommand } from './help-command';
import { StatusCommand } from './status-command';
import { ExampleCommand } from './example-command';
import { Service } from '../types/service';
import { parseCommandArguments, validateCommandArguments } from './command-parser';

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
        this.registerCommand(new ExampleCommand());
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
     * Get the dynamic schema for a specific command.
     * 
     * @param commandName - The unique name of the command to get the schema for.
     * @param context - Optional context object that can be used to influence schema generation.
     * @returns A promise that resolves to the command schema, or null if the command doesn't exist or has no schema.
     */
    public async getCommandSchema(commandName: string, context?: Record<string, any>): Promise<CommandSchema | null> {
        const command = this.commands.get(commandName);
        
        if (!command) {
            logger.warn(`Attempted to get schema for unknown command: ${commandName}`);
            return null;
        }

        try {
            logger.debug(`Getting dynamic schema for command: ${commandName}`, { context });
            const dynamicSchema = await command.getSchema(context);
            if (dynamicSchema) {
                logger.debug(`Dynamic schema generated for command: ${commandName}`);
                return dynamicSchema;
            }

            logger.debug(`No schema available for command: ${commandName}`);
            return null;
        } catch (error) {
            logger.error(`Failed to get schema for command '${commandName}':`, error);
            throw error;
        }
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

    /**
     * Execute a command from a command string (e.g., "/example --action create --name test").
     * 
     * @param commandString - The full command string including arguments
     * @returns A promise that resolves when the command execution is complete.
     * @throws Error if the command is not found or execution fails.
     */
    public async executeCommandString(commandString: string): Promise<string> {
        // Extract command name from the string
        const parts = commandString.split(/\s+/).filter(part => part.trim() !== '');
        if (parts.length === 0 || !parts[0].startsWith('/')) {
            return `❌ Invalid command format. Commands must start with '/'.`;
        }

        const commandName = parts[0].substring(1).toLowerCase().trim();
        const command = this.commands.get(commandName);
            
        if (!command) {
            return `❌ Unknown command: ${commandName}

Type /help to see available commands.`;
        }

        try {
            // Parse arguments from the command string
            const args = await parseCommandArguments(commandString, command);
            
            // Validate arguments
            const validationErrors = await validateCommandArguments(args, command);
            if (validationErrors.length > 0) {
                return `❌ Command validation errors:\n${validationErrors.map(error => `  • ${error}`).join('\n')}`;
            }

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
