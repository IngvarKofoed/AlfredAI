export interface AIPersonality {
    id: string;
    name: string;
    description: string;
    
    // Core personality traits
    tone: PersonalityTone;
    communicationStyle: CommunicationStyle;
    expertise: string[];
    
    // Behavioral characteristics
    greeting: string;
    farewell: string;
    errorHandling: ErrorHandlingStyle;
    
    // Response modifiers
    verbosity: VerbosityLevel;
    formality: FormalityLevel;
    creativity: CreativityLevel;
    
    // Custom prompts and context
    systemPrompt?: string;
    contextualPrompts?: Record<string, string>;
    
    // Metadata
    createdAt: string;
    updatedAt: string;
    author?: string;
    version: string;
    tags: string[];
}

export type PersonalityTone = 
    | 'professional'
    | 'friendly'
    | 'casual'
    | 'enthusiastic'
    | 'calm'
    | 'authoritative'
    | 'supportive'
    | 'witty'
    | 'serious'
    | 'playful';

export type CommunicationStyle = 
    | 'direct'
    | 'conversational'
    | 'explanatory'
    | 'concise'
    | 'detailed'
    | 'socratic'
    | 'collaborative'
    | 'mentoring';

export type ErrorHandlingStyle = 
    | 'apologetic'
    | 'solution-focused'
    | 'educational'
    | 'reassuring'
    | 'direct'
    | 'encouraging';

export type VerbosityLevel = 'minimal' | 'moderate' | 'detailed' | 'comprehensive';
export type FormalityLevel = 'casual' | 'semi-formal' | 'formal' | 'academic';
export type CreativityLevel = 'conservative' | 'balanced' | 'creative' | 'experimental';

export interface PersonalityPreset {
    name: string;
    description: string;
    personality: Omit<AIPersonality, 'id' | 'createdAt' | 'updatedAt' | 'version'>;
}

export interface PersonalityConfig {
    activePersonalityId?: string;
    personalities: Record<string, AIPersonality>;
    presets: PersonalityPreset[];
} 