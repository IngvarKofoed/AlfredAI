import { Tool, ToolResult, ToolInitializationContext } from '../tool';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '../../utils/logger';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const execAsync = promisify(exec);

export const pythonTool: Tool = {
    description: {
        name: 'python',
        description: 'Execute Python scripts and return the stdout and stderr output. This tool allows you to run Python code for data processing, calculations, API calls, or any other Python-based tasks.',
        parameters: [
            { 
                name: 'script', 
                description: 'The Python script to execute. This can be either a Python code snippet or a path to a Python file.', 
                usage: 'Python script or file path', 
                required: true 
            },
            { 
                name: 'args', 
                description: 'Additional arguments to pass to the Python script (optional)', 
                usage: 'space-separated arguments', 
                required: false 
            },
            { 
                name: 'cwd', 
                description: 'The working directory to execute the script in (optional)', 
                usage: 'working directory path', 
                required: false 
            },
        ],
        examples: [
            {
                description: 'Execute a simple Python calculation',
                parameters: [
                    { name: 'script', value: 'print("Hello, World!")\nprint(2 + 2)' },
                ],
            },
            {
                description: 'Run a Python file with arguments',
                parameters: [
                    { name: 'script', value: 'script.py' },
                    { name: 'args', value: '--input data.txt --output result.json' },
                ],
            },
            {
                description: 'Execute Python code with imports',
                parameters: [
                    { name: 'script', value: 'import json\nimport sys\nprint(json.dumps({"status": "success", "args": sys.argv[1:]}))' },
                    { name: 'args', value: 'arg1 arg2' },
                ],
            },
        ],
    },

    initialize: async (context: ToolInitializationContext) => {
        // Check if Python is available
        try {
            const { stdout } = await execAsync('python --version');
            logger.info(`Python tool initialized. Python version: ${stdout.trim()}`);
        } catch (error) {
            try {
                const { stdout } = await execAsync('python3 --version');
                logger.info(`Python tool initialized. Python3 version: ${stdout.trim()}`);
            } catch (error) {
                logger.warn('Python tool initialized but Python may not be available on the system');
            }
        }
    },

    execute: async (parameters: Record<string, any>): Promise<ToolResult> => {
        try {
            const script = parameters.script;
            const args = parameters.args || '';
            const cwd = parameters.cwd;

            if (!script) {
                return {
                    success: false,
                    error: 'Script parameter is required'
                };
            }

            // Determine if script is a file path or code snippet
            const isFilePath = script.endsWith('.py') || path.isAbsolute(script) || fs.existsSync(script);
            
            let pythonCommand: string;
            let scriptContent: string;

            if (isFilePath) {
                // It's a file path - execute the file directly
                const resolvedPath = path.resolve(script);
                if (!fs.existsSync(resolvedPath)) {
                    return {
                        success: false,
                        error: `Python file not found: ${resolvedPath}`
                    };
                }
                pythonCommand = `python "${resolvedPath}" ${args}`.trim();
                scriptContent = `File: ${resolvedPath}`;
            } else {
                // It's a code snippet - create a temporary file
                const tempDir = os.tmpdir();
                const tempFile = path.join(tempDir, `python_script_${Date.now()}.py`);
                
                try {
                    fs.writeFileSync(tempFile, script);
                    pythonCommand = `python "${tempFile}" ${args}`.trim();
                    scriptContent = script;
                    
                    // Clean up temp file after execution
                    setTimeout(() => {
                        try {
                            fs.unlinkSync(tempFile);
                        } catch (error) {
                            logger.debug(`Failed to clean up temp file ${tempFile}: ${error}`);
                        }
                    }, 1000);
                } catch (error) {
                    return {
                        success: false,
                        error: `Failed to create temporary Python file: ${error}`
                    };
                }
            }

            // Basic security check - prevent obviously dangerous operations
            const dangerousPatterns = [
                /import\s+os\s*;?\s*os\.system/, // os.system calls
                /import\s+subprocess\s*;?\s*subprocess\.call/, // subprocess calls
                /eval\(/, // eval function
                /exec\(/, // exec function
                /__import__\(/, // __import__ function
                /open\(.*w.*\)/, // file write operations
                /file\(.*w.*\)/, // file write operations
            ];

            const isDangerous = dangerousPatterns.some(pattern => pattern.test(scriptContent.toLowerCase()));
            if (isDangerous) {
                return {
                    success: false,
                    error: 'Script contains potentially dangerous operations and was blocked for security reasons'
                };
            }

            logger.info(`Executing Python script: ${isFilePath ? 'file' : 'snippet'}${cwd ? ` in directory: ${cwd}` : ''}`);

            const options: any = {
                timeout: 60000, // 60 second timeout for Python scripts
                maxBuffer: 1024 * 1024 * 10, // 10MB buffer for larger outputs
            };

            if (cwd) {
                // Resolve the working directory path
                const resolvedCwd = path.resolve(cwd);
                options.cwd = resolvedCwd;
                logger.debug(`Working directory set to: ${resolvedCwd}`);
            }

            const { stdout, stderr } = await execAsync(pythonCommand, options);

            let result = '';
            if (stdout) {
                result += `STDOUT:\n${stdout}\n`;
            }
            if (stderr) {
                result += `STDERR:\n${stderr}\n`;
            }

            logger.info(`Python script executed successfully`);
            logger.debug(`Python script output: ${result}`);

            return {
                success: true,
                result: result || 'Python script executed successfully with no output'
            };

        } catch (error: any) {
            logger.error(`Error executing Python script: ${error}`);
            
            let errorMessage = 'Failed to execute Python script';
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
