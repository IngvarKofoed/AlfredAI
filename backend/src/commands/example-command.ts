import { Command, CommandSchema } from '../types/command';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Example command that demonstrates dynamic schema generation.
 * 
 * This command shows how to generate different schemas based on runtime
 * conditions, such as available files, system state, or user context.
 */
export class ExampleCommand implements Command {
    name = 'example';
    description = 'Example command demonstrating dynamic schema generation';

    async getSchema(context?: Record<string, any>): Promise<CommandSchema | null> {
        // Get current working directory
        const cwd = process.cwd();
        
        // Read available files in current directory
        const files = await fs.readdir(cwd);
        const fileChoices = files
            .filter(file => !file.startsWith('.')) // Exclude hidden files
            .map(file => ({ label: file, value: file }))
            .slice(0, 10); // Limit to first 10 files for UI

        // Generate dynamic schema based on available files
        const dynamicSchema: CommandSchema = {
            arguments: [
                {
                    name: 'action',
                    description: 'The action to perform',
                    type: 'select',
                    required: true,
                    choices: [
                        { label: 'Create', value: 'create', description: 'Create a new item' },
                        { label: 'Update', value: 'update', description: 'Update an existing item' },
                        { label: 'Delete', value: 'delete', description: 'Delete an item' },
                        { label: 'Process File', value: 'process-file', description: 'Process an existing file' }
                    ]
                },
                {
                    name: 'name',
                    description: 'Name of the item',
                    type: 'string',
                    required: true,
                    pattern: '^[a-zA-Z0-9_-]+$'
                }
            ],
            options: [
                {
                    name: 'file',
                    description: 'File to process (dynamically populated)',
                    type: 'select',
                    choices: fileChoices
                },
                {
                    name: 'verbose',
                    short: 'v',
                    description: 'Enable verbose output',
                    type: 'boolean',
                    default: false
                },
                {
                    name: 'format',
                    description: 'Output format',
                    type: 'select',
                    default: 'text',
                    choices: [
                        { label: 'Text', value: 'text' },
                        { label: 'JSON', value: 'json' },
                        { label: 'YAML', value: 'yaml' }
                    ]
                },
                {
                    name: 'timeout',
                    description: 'Operation timeout in seconds',
                    type: 'number',
                    default: 30,
                    min: 1,
                    max: 300
                }
            ]
        };

        // Add context-specific options if provided
        if (context?.userRole === 'admin') {
            dynamicSchema.options?.push({
                name: 'force',
                short: 'f',
                description: 'Force operation (admin only)',
                type: 'boolean',
                default: false
            });
        }

        return dynamicSchema;
    }

    async execute(args?: Record<string, any>): Promise<string> {
        const { action, name, file, verbose, format = 'text', timeout = 30, force } = args || {};

        if (!action || !name) {
            return '❌ Missing required arguments: action and name are required';
        }

        let result = `✅ Executing ${action} operation on "${name}"\n`;
        result += `⚙️  Format: ${format}\n`;
        result += `⏱️  Timeout: ${timeout}s\n`;
        
        if (file) {
            result += `📁 File: ${file}\n`;
        }
        
        if (verbose) {
            result += `🔍 Verbose mode enabled\n`;
        }

        if (force) {
            result += `⚡ Force mode enabled (admin)\n`;
        }

        // Handle different actions
        switch (action) {
            case 'process-file':
                if (!file) {
                    return '❌ File argument is required for process-file action';
                }
                result += `\n🔄 Processing file: ${file}\n`;
                break;
            case 'create':
                result += `\n🔄 Creating new item: ${name}\n`;
                break;
            case 'update':
                result += `\n🔄 Updating item: ${name}\n`;
                break;
            case 'delete':
                result += `\n🔄 Deleting item: ${name}\n`;
                break;
            default:
                result += `\n🔄 Processing...\n`;
        }
        
        // Return different formats based on the format option
        switch (format) {
            case 'json':
                return JSON.stringify({
                    success: true,
                    action,
                    name,
                    file,
                    verbose,
                    timeout,
                    force,
                    message: 'Operation completed successfully'
                }, null, 2);
            
            case 'yaml':
                return `success: true
action: ${action}
name: ${name}
file: ${file || 'null'}
verbose: ${verbose}
timeout: ${timeout}
force: ${force || false}
message: Operation completed successfully`;
            
            default:
                return result + `✅ Operation completed successfully!`;
        }
    }
} 