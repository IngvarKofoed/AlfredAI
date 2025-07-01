# Command Arguments and Options System

This document describes how to add arguments and options to commands in AlfredAI.

## Overview

The command system now supports structured arguments and options with validation, type checking, and interactive input. Commands can define a schema that describes their parameters, and the UI will automatically provide a step-by-step wizard for collecting input.

## Command Schema

Commands can optionally define a `schema` property that describes their arguments and options:

```typescript
import { Command, CommandSchema } from '../types/command';

export class MyCommand implements Command {
    name = 'mycommand';
    description = 'My awesome command';
    
    schema: CommandSchema = {
        arguments: [
            // Required arguments
        ],
        options: [
            // Optional flags/options
        ]
    };
    
    async execute(args?: Record<string, any>): Promise<string> {
        // Implementation
    }
}
```

## Argument Types

### String Arguments
```typescript
{
    name: 'filename',
    description: 'Name of the file to process',
    type: 'string',
    required: true,
    pattern: '^[a-zA-Z0-9._-]+$' // Optional regex validation
}
```

### Number Arguments
```typescript
{
    name: 'count',
    description: 'Number of items to process',
    type: 'number',
    required: false,
    default: 1,
    min: 1,        // Optional minimum value
    max: 100       // Optional maximum value
}
```

### Boolean Arguments
```typescript
{
    name: 'force',
    description: 'Force the operation',
    type: 'boolean',
    required: false,
    default: false
}
```

### Select Arguments (Dropdown)
```typescript
{
    name: 'format',
    description: 'Output format',
    type: 'select',
    required: true,
    choices: [
        { label: 'JSON', value: 'json', description: 'JSON format' },
        { label: 'YAML', value: 'yaml', description: 'YAML format' },
        { label: 'Text', value: 'text', description: 'Plain text' }
    ]
}
```

## Options

Options are similar to arguments but are always optional and typically use `--` prefix when passed to commands:

```typescript
{
    name: 'verbose',
    short: 'v',           // Short flag (-v)
    description: 'Enable verbose output',
    type: 'boolean',
    default: false
}
```

## Example Command

Here's a complete example of a command with arguments and options:

```typescript
import { Command, CommandSchema } from '../types/command';

export class ProcessFileCommand implements Command {
    name = 'process';
    description = 'Process files with various options';

    schema: CommandSchema = {
        arguments: [
            {
                name: 'action',
                description: 'Action to perform',
                type: 'select',
                required: true,
                choices: [
                    { label: 'Compress', value: 'compress' },
                    { label: 'Decompress', value: 'decompress' },
                    { label: 'Convert', value: 'convert' }
                ]
            },
            {
                name: 'filename',
                description: 'File to process',
                type: 'string',
                required: true,
                pattern: '^[a-zA-Z0-9._-]+$'
            },
            {
                name: 'quality',
                description: 'Quality level (1-100)',
                type: 'number',
                required: false,
                default: 80,
                min: 1,
                max: 100
            }
        ],
        options: [
            {
                name: 'verbose',
                short: 'v',
                description: 'Enable verbose output',
                type: 'boolean',
                default: false
            },
            {
                name: 'output',
                short: 'o',
                description: 'Output format',
                type: 'select',
                default: 'auto',
                choices: [
                    { label: 'Auto', value: 'auto' },
                    { label: 'PNG', value: 'png' },
                    { label: 'JPEG', value: 'jpeg' }
                ]
            }
        ]
    };

    async execute(args?: Record<string, any>): Promise<string> {
        const { action, filename, quality = 80, verbose, output = 'auto' } = args || {};
        
        if (!action || !filename) {
            return '❌ Missing required arguments: action and filename are required';
        }

        let result = `🔄 Processing ${filename} with ${action} action\n`;
        result += `⚙️  Quality: ${quality}\n`;
        result += `📤 Output: ${output}\n`;
        
        if (verbose) {
            result += `🔍 Verbose mode enabled\n`;
        }

        // Simulate processing
        result += `\n✅ File processed successfully!`;
        
        return result;
    }
}
```

## User Experience

When a user selects a command with arguments/options:

1. **Command Selection**: User types `/` to see available commands
2. **Command Choice**: User selects a command from the list
3. **Input Wizard**: If the command has arguments/options, a step-by-step wizard appears
4. **Validation**: Each input is validated according to the schema
5. **Execution**: The command is executed with the collected arguments

## Backend Integration

The command service automatically handles commands with schemas. When a command is executed, the arguments are passed to the `execute` method as a structured object.

## Help Integration

The `/help` command automatically displays argument and option information for commands that have schemas defined.

## Best Practices

1. **Clear Descriptions**: Provide clear, concise descriptions for all arguments and options
2. **Sensible Defaults**: Use defaults for optional parameters when possible
3. **Validation**: Use patterns and min/max values to validate input
4. **Choices**: Use select types for parameters with a limited set of valid values
5. **Required vs Optional**: Only make arguments required when absolutely necessary
6. **Short Flags**: Provide short flags for commonly used options 