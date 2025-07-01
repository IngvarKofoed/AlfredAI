import { Command } from '../types/command';
import { getCommandService } from '../service-locator';

/**
 * Help command that displays information about all available commands.
 * 
 * This command retrieves all registered commands from the command service
 * and formats them into a user-friendly help message.
 */
export class HelpCommand implements Command {
    name = 'help';
    description = 'Display help information for all available commands';

    async execute(args?: Record<string, any>): Promise<string> {
        try {
            const commandService = getCommandService();
            const allCommands = commandService.getAllCommands();
            
            if (allCommands.length === 0) {
                return 'No commands are currently registered.';
            }
            
            let helpText = `Available Commands:\n\n`;
            
            // Sort commands alphabetically by name
            const sortedCommands = allCommands.sort((a, b) => a.name.localeCompare(b.name));
            
            sortedCommands.forEach((command, index) => {
                helpText += `• /${command.name} - ${command.description}\n`;
            });
            
            helpText += `\nJust start typing to chat with Alfred AI!`;
            
            return helpText;
        } catch (error: any) {
            throw new Error(`Failed to generate help: ${error.message}`);
        }
    }
}
