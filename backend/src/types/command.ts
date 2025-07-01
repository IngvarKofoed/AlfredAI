/**
 * Interface for commands that can execute specific commands.
 * 
 * Commands are responsible for handling different types of commands
 * that can be executed by the system. Each command should implement
 * this interface to ensure consistent command execution patterns.
 */
export interface Command {
    /**
     * The unique name identifier for this command provider.
     * 
     * This name should be descriptive and unique across all command providers
     * in the system. It's typically used for command routing and identification.
     * 
     * @example "file-upload", "data-processing", "system-cleanup"
     */
    name: string;

    /**
     * A human-readable description of what this command does.
     * 
     * This description should provide clear information about the command's
     * purpose, functionality, and expected behavior. It's used for
     * documentation, help text, and user interface displays.
     * 
     * @example "Uploads files to the specified destination with progress tracking"
     * @example "Processes data files and generates analysis reports"
     * @example "Performs system cleanup tasks to free up disk space"
     */
    description: string;

    /**
     * Generates a dynamic schema for this command based on current system state.
     * 
     * This method allows commands to generate different schemas based on runtime
     * conditions, such as available files, system state, or user permissions.
     * If this method is not implemented, the static schema property will be used.
     * 
     * @param context - Optional context object that can be used to influence schema generation.
     *                  This might include user permissions, current working directory, etc.
     * 
     * @returns A promise that resolves to the command schema, or null if no schema is needed.
     * 
     * @example
     * ```typescript
     * async getSchema(context?: Record<string, any>): Promise<CommandSchema | null> {
     *   // Generate schema based on available files
     *   const files = await fs.readdir('.');
     *   return {
     *     arguments: [
     *       {
     *         name: 'file',
     *         description: 'File to process',
     *         type: 'select',
     *         required: true,
     *         choices: files.map(file => ({ label: file, value: file }))
     *       }
     *     ]
     *   };
     * }
     * ```
     */
    getSchema(context?: Record<string, any>): Promise<CommandSchema | null>;

    /**
     * Executes the command with the provided arguments.
     * 
     * This method should contain the main logic for the command execution.
     * The implementation should handle any errors internally and throw
     * appropriate exceptions if the command cannot be completed.
     * 
     * @param args - Optional arguments object containing parameters for the command.
     *               The structure of this object depends on the specific command.
     *               Can be undefined if no arguments are required.
     * 
     * @returns A promise that resolves to a string result when the command execution is complete.
     *          The string typically contains output, status information, or results from the command.
     *          The promise should reject if the command fails to execute properly.
     * 
     * @example
     * ```typescript
     * // Example implementation
     * async execute(args?: Record<string, any>): Promise<string> {
     *   const { filePath, options } = args || {};
     *   if (!filePath) {
     *     throw new Error('filePath is required');
     *   }
     *   // Command logic here...
     *   return "File uploaded successfully";
     * }
     * ```
     */
    execute(args?: Record<string, any>): Promise<string>;
}

/**
 * Schema defining the arguments and options for a command.
 */
export interface CommandSchema {
    /**
     * Required arguments for the command.
     */
    arguments?: CommandArgument[];
    
    /**
     * Optional flags/options for the command.
     */
    options?: CommandOption[];
}

/**
 * Definition of a command argument.
 */
export interface CommandArgument {
    /**
     * The name of the argument.
     */
    name: string;
    
    /**
     * Human-readable description of what this argument does.
     */
    description: string;
    
    /**
     * The type of the argument.
     */
    type: 'string' | 'number' | 'boolean' | 'select';
    
    /**
     * Whether this argument is required.
     */
    required: boolean;
    
    /**
     * Default value for the argument (if not required).
     */
    default?: any;
    
    /**
     * For select type arguments, the available choices.
     */
    choices?: Array<{
        label: string;
        value: any;
        description?: string;
    }>;
    
    /**
     * Validation pattern for string arguments (regex).
     */
    pattern?: string;
    
    /**
     * Minimum value for number arguments.
     */
    min?: number;
    
    /**
     * Maximum value for number arguments.
     */
    max?: number;
}

/**
 * Definition of a command option/flag.
 */
export interface CommandOption {
    /**
     * The name of the option.
     */
    name: string;
    
    /**
     * Short flag for the option (e.g., 'v' for --verbose).
     */
    short?: string;
    
    /**
     * Human-readable description of what this option does.
     */
    description: string;
    
    /**
     * The type of the option.
     */
    type: 'boolean' | 'string' | 'number' | 'select';
    
    /**
     * Default value for the option.
     */
    default?: any;
    
    /**
     * For select type options, the available choices.
     */
    choices?: Array<{
        label: string;
        value: any;
        description?: string;
    }>;
    
    /**
     * Validation pattern for string options (regex).
     */
    pattern?: string;
    
    /**
     * Minimum value for number options.
     */
    min?: number;
    
    /**
     * Maximum value for number options.
     */
    max?: number;
}