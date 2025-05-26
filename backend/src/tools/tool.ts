
export interface Tool {
    description: ToolDescription;
    execute: (parameters: Record<string, any>) => Promise<ToolResult>;
}

export interface ToolResult {
    success: boolean;
    error?: string;
    result?: string;
}

export interface ToolDescription {
    name: string;
    description: string;
    parameters: ToolParameter[];
    examples: ToolExample[];
}

export interface ToolParameter {
    name: string;
    description: string;
    usage: string;
    required: boolean;
}

export interface ToolExample {
    description: string;
    parameters: ToolExampleParameter[];
}

export interface ToolExampleParameter {
    name: string;
    value: string;
}
