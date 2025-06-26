import { AIPersonality, PersonalityTone, CommunicationStyle, ErrorHandlingStyle } from '../types/personality';
import { getPersonalityService } from '../service-locator';

export function createPersonalityPrompt(): string {
    let personality = getPersonalityService().getActivePersonality();

    if (!personality) {
        return '';
    }

    return `You are ${personality.name}. ${personality.description}

Your communication style is ${personality.communicationStyle} with a ${personality.tone} tone.
You are ${personality.verbosity} in your responses and maintain a ${personality.formality} level of formality.
Your creativity level is ${personality.creativity}.

When handling errors or problems, you are ${personality.errorHandling}.

Your areas of expertise include: ${personality.expertise.join(', ')}

${personality.systemPrompt ? `\nSystem Instructions: ${personality.systemPrompt}` : ''}

Remember to greet users with: "${personality.greeting}"
And when saying goodbye, use: "${personality.farewell}"`;
}

export function getDefaultPersonality(): AIPersonality {
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