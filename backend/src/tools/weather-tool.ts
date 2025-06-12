import { Tool, ToolInitializationContext } from './tool';

export const weatherTool: Tool = {
    description: {
        name: 'weather',
        description: 'Get the weather in a specific location',
        parameters: [
            {
                name: 'location',
                description: 'The location to get the weather for',
                usage: 'location to get the weather for',
                required: true,
            }
        ],
        examples: [
            {
                description: 'Get the weather in Copenhagen, Denmark',
                parameters: [
                    {
                        name: 'location',
                        value: 'Copenhagen, Denmark',
                    }
                ],
            },
            {
                description: 'Get the weather in Hillerød, Denmark',
                parameters: [
                    {
                        name: 'location',
                        value: 'Hillerød, Denmark',
                    }
                ],
            }
        ],
    },

    initialize: async (context: ToolInitializationContext) => {
        // No initialization needed for weather tool
    },

    execute: async (parameters: Record<string, any>) => {
        const location = parameters.location;
        const weather = 'It is currently 20 degrees and cloudy in ' + location;
        return { success: true, result: weather };
    }
}
