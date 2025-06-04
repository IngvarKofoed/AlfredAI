import { AIPersonality, PersonalityTone, CommunicationStyle, ErrorHandlingStyle } from '../types/personality';
import { personalityManager } from '../tools/personality/personality-manager';

export function createPersonalityPrompt(): string {
    // Get the active personality internally
    let personality = personalityManager.getActivePersonality();
    
    // If no active personality, use a default one
    if (!personality) {
        personality = getDefaultPersonality();
    }
    
    let instructions = `====\n\nPERSONALITY CONFIGURATION\n\n`;
    
    // Add custom system prompt if available
    if (personality.systemPrompt) {
        instructions += `${personality.systemPrompt}\n\n`;
    }
    
    instructions += `**Current Active Personality: ${personality.name}**\n`;
    instructions += `${personality.description}\n\n`;
    
    instructions += `**Behavioral Guidelines:**\n`;
    instructions += `- Tone: ${personality.tone} - ${getToneDescription(personality.tone)}\n`;
    instructions += `- Communication Style: ${personality.communicationStyle} - ${getCommunicationStyleDescription(personality.communicationStyle)}\n`;
    instructions += `- Error Handling: ${personality.errorHandling} - ${getErrorHandlingDescription(personality.errorHandling)}\n`;
    instructions += `- Verbosity Level: ${personality.verbosity}\n`;
    instructions += `- Formality Level: ${personality.formality}\n`;
    instructions += `- Creativity Level: ${personality.creativity}\n\n`;
    
    if (personality.expertise && personality.expertise.length > 0) {
        instructions += `**Areas of Expertise:**\n`;
        instructions += personality.expertise.map((area: string) => `- ${area}`).join('\n') + '\n\n';
    }
    
    if (personality.contextualPrompts && Object.keys(personality.contextualPrompts).length > 0) {
        instructions += `**Contextual Response Guidelines:**\n`;
        for (const [context, prompt] of Object.entries(personality.contextualPrompts)) {
            instructions += `- ${context}: ${prompt}\n`;
        }
        instructions += '\n';
    }
    
    instructions += `**Session Messages:**\n`;
    instructions += `- Use this greeting for new conversations: "${personality.greeting}"\n`;
    instructions += `- Use this farewell when conversations end: "${personality.farewell}"\n\n`;
    
    instructions += `**Important:** Embody this personality consistently throughout the conversation while maintaining your core functionality and tool usage capabilities. Adapt your language, explanations, and approach to match these personality traits.`;
    
    return instructions;
}

function getDefaultPersonality(): AIPersonality {
    return {
        id: 'default',
        name: 'Helpful Assistant (Default)',
        description: 'Helpful, knowledgeable assistant focused on providing clear and useful assistance',
        tone: 'friendly',
        communicationStyle: 'direct',
        expertise: ['general', 'problem-solving'],
        greeting: 'Hello! I\'m here to help you with whatever you need.',
        farewell: 'Thank you for using my assistance. Have a great day!',
        errorHandling: 'solution-focused',
        verbosity: 'moderate',
        formality: 'semi-formal',
        creativity: 'balanced',
        tags: ['default', 'general'],
        author: 'System',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0'
    };
}

function getToneDescription(tone: PersonalityTone): string {
    const descriptions: Record<PersonalityTone, string> = {
        'professional': 'Business-like, formal, and efficient',
        'friendly': 'Warm, approachable, and personable',
        'casual': 'Relaxed, informal, and conversational',
        'enthusiastic': 'Energetic, excited, and passionate',
        'calm': 'Peaceful, measured, and composed',
        'authoritative': 'Confident, expert-like, and decisive',
        'supportive': 'Encouraging, helpful, and nurturing',
        'witty': 'Clever, humorous, and quick with wordplay',
        'serious': 'Focused, no-nonsense, and earnest',
        'playful': 'Fun, lighthearted, and creative'
    };
    return descriptions[tone];
}

function getCommunicationStyleDescription(style: CommunicationStyle): string {
    const descriptions: Record<CommunicationStyle, string> = {
        'direct': 'Straight to the point, clear and concise',
        'conversational': 'Natural, flowing dialogue style',
        'explanatory': 'Detailed explanations with context',
        'concise': 'Brief, compact responses',
        'detailed': 'Thorough, comprehensive answers',
        'socratic': 'Teaching through thoughtful questions',
        'collaborative': 'Working together, partnership approach',
        'mentoring': 'Guiding and teaching with patience'
    };
    return descriptions[style];
}

function getErrorHandlingDescription(style: ErrorHandlingStyle): string {
    const descriptions: Record<ErrorHandlingStyle, string> = {
        'apologetic': 'Express regret and take responsibility',
        'solution-focused': 'Immediately provide fixes and alternatives',
        'educational': 'Explain what went wrong and why',
        'reassuring': 'Calm fears and build confidence',
        'direct': 'Factual, straightforward error reporting',
        'encouraging': 'Motivational, positive spin on setbacks'
    };
    return descriptions[style];
} 