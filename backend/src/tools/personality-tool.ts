import { Tool } from './tool';
import { personalityManager } from '../utils/personality-manager';
import { AIPersonality } from '../types/personality';

export const personalityTool: Tool = {
    description: {
        name: 'personalityManager',
        description: 'Manage AI personality cards for customizing assistant behavior and responses',
        parameters: [
            {
                name: 'action',
                description: 'The personality management action to perform',
                usage: 'Action: create, list, get, update, delete, activate, deactivate, search, list-presets, create-from-preset, export, import',
                required: true,
            },
            {
                name: 'personalityId',
                description: 'The ID of the personality (required for get, update, delete, activate, export actions)',
                usage: 'personality_1234567890_abcdef123',
                required: false,
            },
            {
                name: 'name',
                description: 'The name of the personality (required for create action)',
                usage: 'Friendly Assistant',
                required: false,
            },
            {
                name: 'description',
                description: 'Description of the personality',
                usage: 'A helpful and friendly assistant',
                required: false,
            },
            {
                name: 'tone',
                description: 'The tone of the personality',
                usage: 'professional, friendly, casual, enthusiastic, calm, authoritative, supportive, witty, serious, playful',
                required: false,
            },
            {
                name: 'communicationStyle',
                description: 'The communication style',
                usage: 'direct, conversational, explanatory, concise, detailed, socratic, collaborative, mentoring',
                required: false,
            },
            {
                name: 'expertise',
                description: 'Areas of expertise (comma-separated)',
                usage: 'programming,web-development,debugging',
                required: false,
            },
            {
                name: 'greeting',
                description: 'Custom greeting message',
                usage: 'Hello! How can I help you today?',
                required: false,
            },
            {
                name: 'farewell',
                description: 'Custom farewell message',
                usage: 'Goodbye! Have a great day!',
                required: false,
            },
            {
                name: 'errorHandling',
                description: 'Error handling style',
                usage: 'apologetic, solution-focused, educational, reassuring, direct, encouraging',
                required: false,
            },
            {
                name: 'verbosity',
                description: 'Response verbosity level',
                usage: 'minimal, moderate, detailed, comprehensive',
                required: false,
            },
            {
                name: 'formality',
                description: 'Formality level',
                usage: 'casual, semi-formal, formal, academic',
                required: false,
            },
            {
                name: 'creativity',
                description: 'Creativity level',
                usage: 'conservative, balanced, creative, experimental',
                required: false,
            },
            {
                name: 'systemPrompt',
                description: 'Custom system prompt for the personality',
                usage: 'You are a helpful assistant specialized in...',
                required: false,
            },
            {
                name: 'tags',
                description: 'Tags for categorizing (comma-separated)',
                usage: 'coding,friendly,helpful',
                required: false,
            },
            {
                name: 'author',
                description: 'Author of the personality',
                usage: 'John Doe',
                required: false,
            },
            {
                name: 'query',
                description: 'Search query (for search action)',
                usage: 'coding assistant',
                required: false,
            },
            {
                name: 'presetName',
                description: 'Name of the preset to use (for create-from-preset action)',
                usage: 'Friendly Coding Buddy',
                required: false,
            },
            {
                name: 'personalityData',
                description: 'JSON string of personality data (for import action)',
                usage: '{"name":"Custom","description":"..."}',
                required: false,
            }
        ],
        examples: [
            {
                description: 'List all personalities',
                parameters: [
                    { name: 'action', value: 'list' }
                ],
            },
            {
                description: 'Create a new coding assistant personality',
                parameters: [
                    { name: 'action', value: 'create' },
                    { name: 'name', value: 'Code Helper' },
                    { name: 'description', value: 'Specialized coding assistant' },
                    { name: 'tone', value: 'friendly' },
                    { name: 'communicationStyle', value: 'explanatory' },
                    { name: 'expertise', value: 'programming,debugging,web-development' },
                    { name: 'greeting', value: 'Hey! Let\'s write some great code together!' },
                    { name: 'tags', value: 'coding,development,helper' }
                ],
            },
            {
                description: 'Activate a personality',
                parameters: [
                    { name: 'action', value: 'activate' },
                    { name: 'personalityId', value: 'personality_1234567890_abcdef123' }
                ],
            },
            {
                description: 'Search for personalities',
                parameters: [
                    { name: 'action', value: 'search' },
                    { name: 'query', value: 'coding' }
                ],
            },
            {
                description: 'Create personality from preset',
                parameters: [
                    { name: 'action', value: 'create-from-preset' },
                    { name: 'presetName', value: 'Friendly Coding Buddy' },
                    { name: 'name', value: 'My Coding Assistant' }
                ],
            },
            {
                description: 'Get active personality',
                parameters: [
                    { name: 'action', value: 'get-active' }
                ],
            }
        ],
    },

    execute: async (parameters: Record<string, any>) => {
        const action = parameters.action;

        try {
            switch (action) {
                case 'list':
                    return handleListPersonalities();

                case 'get':
                    return handleGetPersonality(parameters.personalityId);

                case 'get-active':
                    return handleGetActivePersonality();

                case 'create':
                    return handleCreatePersonality(parameters);

                case 'update':
                    return handleUpdatePersonality(parameters);

                case 'delete':
                    return handleDeletePersonality(parameters.personalityId);

                case 'activate':
                    return handleActivatePersonality(parameters.personalityId);

                case 'deactivate':
                    return handleDeactivatePersonality();

                case 'search':
                    return handleSearchPersonalities(parameters.query);

                case 'list-presets':
                    return handleListPresets();

                case 'create-from-preset':
                    return handleCreateFromPreset(parameters);

                case 'export':
                    return handleExportPersonality(parameters.personalityId);

                case 'import':
                    return handleImportPersonality(parameters.personalityData);

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}. Available actions: create, list, get, get-active, update, delete, activate, deactivate, search, list-presets, create-from-preset, export, import`
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: `Failed to execute personality action '${action}': ${error instanceof Error ? error.message : String(error)}`
            };
        }
    }
};

// Action handlers
async function handleListPersonalities() {
    const personalities = personalityManager.getAllPersonalities();
    const activeId = personalityManager.getActivePersonality()?.id;
    
    if (Object.keys(personalities).length === 0) {
        return {
            success: true,
            result: "📭 No personalities found. Use the 'list-presets' action to see available presets you can create personalities from."
        };
    }
    
    let result = `📋 **Your AI Personalities** (${Object.keys(personalities).length}):\n\n`;
    
    for (const personality of Object.values(personalities)) {
        const isActive = personality.id === activeId ? ' 🟢 ACTIVE' : '';
        result += `📋 **${personality.name}**${isActive}\n`;
        result += `• Description: ${personality.description}\n`;
        result += `• Tone: ${personality.tone}, Style: ${personality.communicationStyle}\n`;
        result += `• ID: \`${personality.id}\`\n\n`;
    }
    
    return {
        success: true,
        result: result
    };
}

async function handleGetPersonality(personalityId: string) {
    if (!personalityId) {
        return { success: false, error: 'personalityId parameter is required for get action' };
    }

    const personality = personalityManager.getPersonality(personalityId);
    if (!personality) {
        return { success: false, error: `Personality with ID '${personalityId}' not found` };
    }

    const result = formatPersonalityDetails(personality);
    return { success: true, result };
}

async function handleGetActivePersonality() {
    const activePersonality = personalityManager.getActivePersonality();
    
    if (!activePersonality) {
        return {
            success: true,
            result: 'No personality is currently active. Use the "activate" action to activate a personality.'
        };
    }

    const result = `🟢 **Active Personality**\n\n${formatPersonalityDetails(activePersonality)}`;
    return { success: true, result };
}

async function handleCreatePersonality(parameters: Record<string, any>) {
    const requiredFields = ['name', 'description', 'tone', 'communicationStyle'];
    for (const field of requiredFields) {
        if (!parameters[field]) {
            return { success: false, error: `${field} parameter is required for create action` };
        }
    }

    // Parse expertise and tags from comma-separated strings
    const expertise = parameters.expertise ? parameters.expertise.split(',').map((s: string) => s.trim()) : [];
    const tags = parameters.tags ? parameters.tags.split(',').map((s: string) => s.trim()) : [];

    const personalityData = {
        name: parameters.name,
        description: parameters.description,
        tone: parameters.tone,
        communicationStyle: parameters.communicationStyle,
        expertise,
        greeting: parameters.greeting || `Hello! I'm ${parameters.name}, ready to assist you.`,
        farewell: parameters.farewell || 'Goodbye! Feel free to reach out anytime.',
        errorHandling: parameters.errorHandling || 'solution-focused',
        verbosity: parameters.verbosity || 'moderate',
        formality: parameters.formality || 'semi-formal',
        creativity: parameters.creativity || 'balanced',
        systemPrompt: parameters.systemPrompt,
        tags,
        author: parameters.author
    };

    const personalityId = personalityManager.createPersonality(personalityData);
    
    return {
        success: true,
        result: `✅ Successfully created personality "${parameters.name}" with ID: ${personalityId}`
    };
}

async function handleUpdatePersonality(parameters: Record<string, any>) {
    if (!parameters.personalityId) {
        return { success: false, error: 'personalityId parameter is required for update action' };
    }

    const updates: Partial<AIPersonality> = {};
    
    // Map parameters to personality fields
    const fieldMap = {
        name: 'name',
        description: 'description',
        tone: 'tone',
        communicationStyle: 'communicationStyle',
        greeting: 'greeting',
        farewell: 'farewell',
        errorHandling: 'errorHandling',
        verbosity: 'verbosity',
        formality: 'formality',
        creativity: 'creativity',
        systemPrompt: 'systemPrompt',
        author: 'author'
    };

    for (const [param, field] of Object.entries(fieldMap)) {
        if (parameters[param] !== undefined) {
            (updates as any)[field] = parameters[param];
        }
    }

    // Handle array fields
    if (parameters.expertise) {
        updates.expertise = parameters.expertise.split(',').map((s: string) => s.trim());
    }
    if (parameters.tags) {
        updates.tags = parameters.tags.split(',').map((s: string) => s.trim());
    }

    const success = personalityManager.updatePersonality(parameters.personalityId, updates);
    
    if (!success) {
        return { success: false, error: `Personality with ID '${parameters.personalityId}' not found` };
    }

    return {
        success: true,
        result: `✅ Successfully updated personality with ID: ${parameters.personalityId}`
    };
}

async function handleDeletePersonality(personalityId: string) {
    if (!personalityId) {
        return { success: false, error: 'personalityId parameter is required for delete action' };
    }

    const personality = personalityManager.getPersonality(personalityId);
    if (!personality) {
        return { success: false, error: `Personality with ID '${personalityId}' not found` };
    }

    const success = personalityManager.deletePersonality(personalityId);
    
    return {
        success: true,
        result: `✅ Successfully deleted personality "${personality.name}" (ID: ${personalityId})`
    };
}

async function handleActivatePersonality(personalityId: string) {
    if (!personalityId) {
        return { success: false, error: 'personalityId parameter is required for activate action' };
    }

    const personality = personalityManager.getPersonality(personalityId);
    if (!personality) {
        return { success: false, error: `Personality with ID '${personalityId}' not found` };
    }

    const success = personalityManager.setActivePersonality(personalityId);
    
    return {
        success: true,
        result: `✅ Successfully activated personality "${personality.name}" (ID: ${personalityId})\n\n${personality.greeting}`
    };
}

async function handleDeactivatePersonality() {
    const activePersonality = personalityManager.getActivePersonality();
    
    if (!activePersonality) {
        return {
            success: true,
            result: 'No personality is currently active.'
        };
    }

    personalityManager.clearActivePersonality();
    
    return {
        success: true,
        result: `✅ Successfully deactivated personality "${activePersonality.name}"\n\n${activePersonality.farewell}`
    };
}

async function handleSearchPersonalities(query: string) {
    if (!query) {
        return { success: false, error: 'query parameter is required for search action' };
    }

    const results = personalityManager.searchPersonalities(query);
    const activeId = personalityManager.getActivePersonality()?.id;
    
    if (results.length === 0) {
        return {
            success: true,
            result: `No personalities found matching query: "${query}"`
        };
    }

    let result = `Found ${results.length} personality(ies) matching "${query}":\n\n`;
    
    results.forEach(personality => {
        const isActive = personality.id === activeId ? ' 🟢 ACTIVE' : '';
        result += `📋 **${personality.name}**${isActive}\n`;
        result += `   ID: ${personality.id}\n`;
        result += `   Description: ${personality.description}\n`;
        result += `   Tags: ${personality.tags.join(', ')}\n\n`;
    });

    return { success: true, result };
}

async function handleListPresets() {
    const presets = personalityManager.getPresets();
    
    let result = `Available personality presets (${presets.length}):\n\n`;
    
    presets.forEach(preset => {
        result += `🎭 **${preset.name}**\n`;
        result += `   Description: ${preset.description}\n`;
        result += `   Tone: ${preset.personality.tone} | Style: ${preset.personality.communicationStyle}\n`;
        result += `   Expertise: ${preset.personality.expertise.join(', ')}\n\n`;
    });

    result += `\nUse "create-from-preset" action to create a personality from any of these presets.`;

    return { success: true, result };
}

async function handleCreateFromPreset(parameters: Record<string, any>) {
    if (!parameters.presetName) {
        return { success: false, error: 'presetName parameter is required for create-from-preset action' };
    }

    const customizations: Partial<AIPersonality> = {};
    
    // Apply any customizations
    if (parameters.name) customizations.name = parameters.name;
    if (parameters.description) customizations.description = parameters.description;
    if (parameters.greeting) customizations.greeting = parameters.greeting;
    if (parameters.farewell) customizations.farewell = parameters.farewell;
    if (parameters.systemPrompt) customizations.systemPrompt = parameters.systemPrompt;
    if (parameters.author) customizations.author = parameters.author;

    const personalityId = personalityManager.createPersonalityFromPreset(parameters.presetName, customizations);
    
    if (!personalityId) {
        return { success: false, error: `Preset "${parameters.presetName}" not found` };
    }

    return {
        success: true,
        result: `✅ Successfully created personality from preset "${parameters.presetName}" with ID: ${personalityId}`
    };
}

async function handleExportPersonality(personalityId: string) {
    if (!personalityId) {
        return { success: false, error: 'personalityId parameter is required for export action' };
    }

    const personality = personalityManager.exportPersonality(personalityId);
    if (!personality) {
        return { success: false, error: `Personality with ID '${personalityId}' not found` };
    }

    return {
        success: true,
        result: `Exported personality "${personality.name}":\n\n\`\`\`json\n${JSON.stringify(personality, null, 2)}\n\`\`\``
    };
}

async function handleImportPersonality(personalityData: string) {
    if (!personalityData) {
        return { success: false, error: 'personalityData parameter is required for import action' };
    }

    try {
        const personality = JSON.parse(personalityData) as AIPersonality;
        const personalityId = personalityManager.importPersonality(personality);
        
        return {
            success: true,
            result: `✅ Successfully imported personality "${personality.name}" with new ID: ${personalityId}`
        };
    } catch (error) {
        return {
            success: false,
            error: `Failed to parse personality data: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

// Utility function to format personality details
function formatPersonalityDetails(personality: AIPersonality): string {
    const activePersonality = personalityManager.getActivePersonality();
    const isActive = activePersonality?.id === personality.id;
    
    return `📋 **${personality.name}**
ID: ${personality.id}
Description: ${personality.description}

**Personality Traits:**
• Tone: ${personality.tone}
• Communication Style: ${personality.communicationStyle}
• Error Handling: ${personality.errorHandling}
• Verbosity: ${personality.verbosity}
• Formality: ${personality.formality}
• Creativity: ${personality.creativity}

**Expertise Areas:**
${personality.expertise.map(exp => `• ${exp}`).join('\n')}

**Messages:**
• Greeting: "${personality.greeting}"
• Farewell: "${personality.farewell}"

**System Prompt:**
${personality.systemPrompt || 'None'}

**Metadata:**
• Author: ${personality.author || 'Unknown'}
• Version: ${personality.version}
• Tags: ${personality.tags.join(', ')}
• Created: ${new Date(personality.createdAt).toLocaleString()}
• Updated: ${new Date(personality.updatedAt).toLocaleString()}
• Status: ${isActive ? '🟢 Active' : '⚪ Inactive'}`;
} 