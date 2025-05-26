import { Tool } from './tool';

export const randomNumberTool: Tool = {
    description: {
        name: 'randomNumber',
        description: 'Generate a random number between a minimum and maximum value',
        parameters: [
            { name: 'min', description: 'The minimum value of the random number', usage: 'minimum value', required: false },
            { name: 'max', description: 'The maximum value of the random number', usage: 'maximum value', required: false },
        ],
        examples: [
            {
                description: 'Generate a random number between 1 and 10',
                parameters: [
                    { name: 'min', value: '1' },
                    { name: 'max', value: '10' },
                ],
            },
        ],
    },

    execute: async (parameters: Record<string, any>) => {
        const min = parameters.min || 0;
        const max = parameters.max || 100;
        const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
        return { success: true, result: randomNumber.toString() };
    },
};

