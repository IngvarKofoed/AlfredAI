import { Command } from '../types/command';

/**
 * Parse command arguments from a command string.
 * 
 * This function takes a command string like "/example --action create --name test --verbose"
 * and converts it into a structured object with the arguments.
 * 
 * @param commandString - The full command string including arguments
 * @param command - The command object to get schema information from
 * @param context - Optional context for dynamic schema generation
 * @returns Parsed arguments object
 */
export async function parseCommandArguments(commandString: string, command: Command, context?: Record<string, any>): Promise<Record<string, any>> {
    const args: Record<string, any> = {};
    
    // Get the schema dynamically
    const schema = await command.getSchema(context);
    
    // If no schema, return empty object
    if (!schema) {
        return args;
    }

    // Split the command string into parts
    const parts = commandString.split(/\s+/).filter(part => part.trim() !== '');
    
    // Remove the command name (first part after /)
    if (parts.length > 0 && parts[0].startsWith('/')) {
        parts.shift();
    }

    let i = 0;
    while (i < parts.length) {
        const part = parts[i];
        
        if (part.startsWith('--')) {
            const name = part.substring(2);
            // Try to match argument first
            const arg = schema.arguments?.find((arg: any) => arg.name === name);
            if (arg) {
                if (i + 1 < parts.length && !parts[i + 1].startsWith('--')) {
                    args[name] = parseValue(parts[i + 1], arg.type);
                    i++;
                }
            } else {
                // Try to match option
                const option = schema.options?.find((opt: any) => opt.name === name);
                if (option) {
                    if (option.type === 'boolean') {
                        args[name] = true;
                    } else if (i + 1 < parts.length && !parts[i + 1].startsWith('--')) {
                        args[name] = parseValue(parts[i + 1], option.type);
                        i++;
                    } else if (option.default !== undefined) {
                        args[name] = option.default;
                    }
                }
            }
        } else {
            // This might be a positional argument
            const argumentIndex = Object.keys(args).length;
            const argument = schema.arguments?.[argumentIndex];
            
            if (argument) {
                args[argument.name] = parseValue(part, argument.type);
            }
        }
        
        i++;
    }

    // Apply defaults for missing arguments and options
    if (schema.arguments) {
        schema.arguments.forEach((arg: any) => {
            if (args[arg.name] === undefined && arg.default !== undefined) {
                args[arg.name] = arg.default;
            }
        });
    }

    if (schema.options) {
        schema.options.forEach((opt: any) => {
            if (args[opt.name] === undefined && opt.default !== undefined) {
                args[opt.name] = opt.default;
            }
        });
    }

    return args;
}

/**
 * Parse a string value into the appropriate type.
 */
function parseValue(value: string, type: string): any {
    switch (type) {
        case 'number':
            const num = Number(value);
            return isNaN(num) ? value : num;
        case 'boolean':
            return value.toLowerCase() === 'true' || value === '1';
        case 'string':
        case 'select':
        default:
            return value;
    }
}

/**
 * Validate parsed arguments against the command schema.
 */
export async function validateCommandArguments(args: Record<string, any>, command: Command, context?: Record<string, any>): Promise<string[]> {
    const errors: string[] = [];
    
    // Get the schema dynamically
    const schema = await command.getSchema(context);
    
    if (!schema) {
        return errors;
    }

    // Check required arguments
    if (schema.arguments) {
        for (const arg of schema.arguments) {
            if (arg.required && (args[arg.name] === undefined || args[arg.name] === null || args[arg.name] === '')) {
                errors.push(`${arg.name} is required`);
            }
        }
    }

    // Validate argument values
    if (schema.arguments) {
        for (const arg of schema.arguments) {
            const value = args[arg.name];
            if (value !== undefined && value !== null && value !== '') {
                const validationError = validateValue(value, arg);
                if (validationError) {
                    errors.push(validationError);
                }
            }
        }
    }

    // Validate option values
    if (schema.options) {
        for (const opt of schema.options) {
            const value = args[opt.name];
            if (value !== undefined && value !== null && value !== '') {
                const validationError = validateValue(value, opt);
                if (validationError) {
                    errors.push(validationError);
                }
            }
        }
    }

    return errors;
}

/**
 * Validate a single value against its schema definition.
 */
function validateValue(value: any, schema: any): string | null {
    switch (schema.type) {
        case 'string':
            if (schema.pattern && typeof value === 'string') {
                const regex = new RegExp(schema.pattern);
                if (!regex.test(value)) {
                    return `${schema.name} must match pattern: ${schema.pattern}`;
                }
            }
            break;
        case 'number':
            if (typeof value === 'number') {
                if (schema.min !== undefined && value < schema.min) {
                    return `${schema.name} must be at least ${schema.min}`;
                }
                if (schema.max !== undefined && value > schema.max) {
                    return `${schema.name} must be at most ${schema.max}`;
                }
            }
            break;
        case 'select':
            if (schema.choices) {
                const validValues = schema.choices.map((c: any) => c.value);
                if (!validValues.includes(value)) {
                    return `${schema.name} must be one of: ${schema.choices.map((c: any) => c.label).join(', ')}`;
                }
            }
            break;
    }
    
    return null;
} 