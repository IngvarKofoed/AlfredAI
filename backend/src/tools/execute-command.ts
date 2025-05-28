import { Tool, ToolResult } from './tool';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../utils/logger';
import * as path from 'path';

const execAsync = promisify(exec);

export const executeCommandTool: Tool = {
    description: {
        name: 'executeCommand',
        description: 'Request to execute a CLI command on the system. Use this when you need to perform system operations or run specific commands to accomplish any step in the user\'s task. You must tailor your command to the user\'s system and provide a clear explanation of what the command does.',
        parameters: [
            { 
                name: 'command', 
                description: 'The CLI command to execute. This should be valid for the current operating system. Ensure the command is properly formatted and does not contain any harmful instructions.', 
                usage: 'command to execute', 
                required: true 
            },
            { 
                name: 'cwd', 
                description: 'The working directory to execute the command in (optional)', 
                usage: 'working directory path', 
                required: false 
            },
        ],
        examples: [
            {
                description: 'Execute npm run dev',
                parameters: [
                    { name: 'command', value: 'npm run dev' },
                ],
            },
            {
                description: 'List files in a specific directory',
                parameters: [
                    { name: 'command', value: 'ls -la' },
                    { name: 'cwd', value: '/home/user/projects' },
                ],
            },
            {
                description: 'Check Node.js version',
                parameters: [
                    { name: 'command', value: 'node --version' },
                ],
            },
        ],
    },

    execute: async (parameters: Record<string, any>): Promise<ToolResult> => {
        try {
            const command = parameters.command;
            const cwd = parameters.cwd;

            if (!command) {
                return {
                    success: false,
                    error: 'Command parameter is required'
                };
            }

            // Basic security check - prevent obviously dangerous commands
            const dangerousPatterns = [
                /rm\s+-rf\s+\//, // rm -rf /
                /del\s+\/s\s+\/q\s+c:\\/, // del /s /q c:\
                /format\s+c:/, // format c:
                /shutdown/, // shutdown commands
                /reboot/, // reboot commands
                /mkfs/, // filesystem formatting
            ];

            const isDangerous = dangerousPatterns.some(pattern => pattern.test(command.toLowerCase()));
            if (isDangerous) {
                return {
                    success: false,
                    error: 'Command appears to be potentially dangerous and was blocked for security reasons'
                };
            }

            logger.info(`Executing command: ${command}${cwd ? ` in directory: ${cwd}` : ''}`);

            const options: any = {
                timeout: 30000, // 30 second timeout
                maxBuffer: 1024 * 1024, // 1MB buffer
            };

            if (cwd) {
                // Resolve the working directory path
                const resolvedCwd = path.resolve(cwd);
                options.cwd = resolvedCwd;
                logger.debug(`Working directory set to: ${resolvedCwd}`);
            }

            const { stdout, stderr } = await execAsync(command, options);

            let result = '';
            if (stdout) {
                result += `STDOUT:\n${stdout}\n`;
            }
            if (stderr) {
                result += `STDERR:\n${stderr}\n`;
            }

            logger.info(`Command executed successfully`);
            logger.debug(`Command output: ${result}`);

            return {
                success: true,
                result: result || 'Command executed successfully with no output'
            };

        } catch (error: any) {
            logger.error(`Error executing command: ${error}`);
            
            let errorMessage = 'Failed to execute command';
            if (error.code) {
                errorMessage += ` (exit code: ${error.code})`;
            }
            if (error.stdout) {
                errorMessage += `\nSTDOUT: ${error.stdout}`;
            }
            if (error.stderr) {
                errorMessage += `\nSTDERR: ${error.stderr}`;
            }
            if (error.message && !error.stdout && !error.stderr) {
                errorMessage += `: ${error.message}`;
            }

            return {
                success: false,
                error: errorMessage
            };
        }
    }
};