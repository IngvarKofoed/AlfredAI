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
     * @returns A promise that resolves when the command execution is complete.
     *          The promise should reject if the command fails to execute properly.
     * 
     * @example
     * ```typescript
     * // Example implementation
     * async execute(args?: Record<string, any>): Promise<void> {
     *   const { filePath, options } = args || {};
     *   if (!filePath) {
     *     throw new Error('filePath is required');
     *   }
     *   // Command logic here...
     * }
     * ```
     */
    execute(args?: Record<string, any>): Promise<void>;
}