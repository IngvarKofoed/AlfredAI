import fs from 'fs';
import path from 'path';
import { AIPersonality, PersonalityConfig, PersonalityPreset } from '../../types/personality';
import { getWorkingDirectory } from '../../utils/get-working-directory';
import { Service } from '../../types/service';
import { getCommandService } from '../../service-locator';
import { ProviderCommand } from './provider-command';
import { PersonalityCommand } from './personality-command';

export class PersonalityService implements Service {
    private configFilePath: string;
    private config: PersonalityConfig;

    constructor(configFilePath?: string) {
        this.configFilePath = configFilePath || getWorkingDirectory('ai-personalities.json');
        this.config = this.loadConfig();
    }

    async initialize(): Promise<void> {
        const commandService = getCommandService();
        commandService.registerCommand(new ProviderCommand());
        commandService.registerCommand(new PersonalityCommand());
    }

    async close(): Promise<void> {
        // Empty implementation - no cleanup needed
    }

    private loadConfig(): PersonalityConfig {
        try {
            if (fs.existsSync(this.configFilePath)) {
                const configData = fs.readFileSync(this.configFilePath, 'utf-8');
                const loadedConfig = JSON.parse(configData) as PersonalityConfig;
                
                // Ensure the config has the required structure
                return {
                    activePersonalityId: loadedConfig.activePersonalityId,
                    personalities: loadedConfig.personalities || {},
                    presets: loadedConfig.presets || this.getDefaultPresets()
                };
            }
        } catch (error) {
            console.warn(`Failed to load personality config from ${this.configFilePath}:`, error);
        }
        
        // Return default config with presets
        return {
            personalities: {},
            presets: this.getDefaultPresets()
        };
    }

    private saveConfig(): void {
        try {
            // Create directory if it doesn't exist
            const configDir = path.dirname(this.configFilePath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }

            fs.writeFileSync(this.configFilePath, JSON.stringify(this.config, null, 2));
        } catch (error) {
            console.error(`Failed to save personality config to ${this.configFilePath}:`, error);
            throw error;
        }
    }

    private getDefaultPresets(): PersonalityPreset[] {
        return [
            {
                name: 'Professional Assistant',
                description: 'A professional, knowledgeable assistant focused on productivity and efficiency',
                personality: {
                    name: 'Professional Assistant',
                    description: 'Professional, efficient, and knowledgeable assistant',
                    tone: 'professional',
                    communicationStyle: 'direct',
                    expertise: ['general', 'productivity', 'business'],
                    greeting: 'Hello! I\'m ready to assist you with your tasks today.',
                    farewell: 'Thank you for using my services. Have a productive day!',
                    errorHandling: 'solution-focused',
                    verbosity: 'moderate',
                    formality: 'formal',
                    creativity: 'conservative',
                    tags: ['professional', 'productivity', 'business'],
                    author: 'System'
                }
            },
            {
                name: 'Friendly Coding Buddy',
                description: 'A friendly, enthusiastic assistant specialized in coding and development',
                personality: {
                    name: 'Friendly Coding Buddy',
                    description: 'Enthusiastic programming assistant with a friendly approach',
                    tone: 'friendly',
                    communicationStyle: 'conversational',
                    expertise: ['programming', 'web-development', 'debugging', 'architecture'],
                    greeting: 'Hey there! Ready to write some awesome code together? 🚀',
                    farewell: 'Happy coding! Don\'t forget to commit your changes! 😊',
                    errorHandling: 'encouraging',
                    verbosity: 'detailed',
                    formality: 'casual',
                    creativity: 'creative',
                    systemPrompt: 'You are a friendly, enthusiastic coding assistant. Use emojis occasionally and maintain an encouraging tone when helping with programming tasks.',
                    tags: ['coding', 'friendly', 'development', 'programming'],
                    author: 'System'
                }
            },
            {
                name: 'Wise Mentor',
                description: 'A calm, wise mentor focused on teaching and guidance',
                personality: {
                    name: 'Wise Mentor',
                    description: 'Patient, wise mentor focused on teaching and personal growth',
                    tone: 'calm',
                    communicationStyle: 'socratic',
                    expertise: ['education', 'mentoring', 'problem-solving', 'critical-thinking'],
                    greeting: 'Welcome, learner. What knowledge shall we explore together today?',
                    farewell: 'Remember, the journey of learning never truly ends. Until next time.',
                    errorHandling: 'educational',
                    verbosity: 'comprehensive',
                    formality: 'semi-formal',
                    creativity: 'balanced',
                    systemPrompt: 'You are a wise, patient mentor. Guide users through problems by asking thoughtful questions and helping them discover solutions themselves.',
                    tags: ['mentor', 'education', 'wisdom', 'teaching'],
                    author: 'System'
                }
            },
            {
                name: 'Creative Collaborator',
                description: 'An imaginative, creative assistant for brainstorming and ideation',
                personality: {
                    name: 'Creative Collaborator',
                    description: 'Imaginative collaborator for creative projects and brainstorming',
                    tone: 'enthusiastic',
                    communicationStyle: 'collaborative',
                    expertise: ['creativity', 'brainstorming', 'design', 'innovation'],
                    greeting: 'Hey creative soul! What amazing ideas are we cooking up today? ✨',
                    farewell: 'Keep those creative juices flowing! Can\'t wait to see what you create! 🎨',
                    errorHandling: 'encouraging',
                    verbosity: 'detailed',
                    formality: 'casual',
                    creativity: 'experimental',
                    systemPrompt: 'You are a creative, imaginative collaborator. Think outside the box, suggest unconventional solutions, and encourage bold ideas.',
                    tags: ['creative', 'brainstorming', 'innovation', 'design'],
                    author: 'System'
                }
            }
        ];
    }

    // Core personality management methods
    public getAllPersonalities(): Record<string, AIPersonality> {
        return { ...this.config.personalities };
    }

    public getPersonality(id: string): AIPersonality | null {
        return this.config.personalities[id] || null;
    }

    public getActivePersonality(): AIPersonality | null {
        if (this.config.activePersonalityId) {
            return this.getPersonality(this.config.activePersonalityId);
        }
        return null;
    }

    public createPersonality(personality: Omit<AIPersonality, 'id' | 'createdAt' | 'updatedAt' | 'version'>): string {
        const id = this.generateId();
        const now = new Date().toISOString();
        
        const newPersonality: AIPersonality = {
            ...personality,
            id,
            createdAt: now,
            updatedAt: now,
            version: '1.0.0'
        };

        this.config.personalities[id] = newPersonality;
        this.saveConfig();
        return id;
    }

    public updatePersonality(id: string, updates: Partial<Omit<AIPersonality, 'id' | 'createdAt'>>): boolean {
        const personality = this.config.personalities[id];
        if (!personality) {
            return false;
        }

        this.config.personalities[id] = {
            ...personality,
            ...updates,
            id, // Ensure id cannot be changed
            createdAt: personality.createdAt, // Preserve creation date
            updatedAt: new Date().toISOString()
        };

        this.saveConfig();
        return true;
    }

    public deletePersonality(id: string): boolean {
        if (!this.config.personalities[id]) {
            return false;
        }

        // If deleting the active personality, clear the active selection
        if (this.config.activePersonalityId === id) {
            this.config.activePersonalityId = undefined;
        }

        delete this.config.personalities[id];
        this.saveConfig();
        return true;
    }

    public setActivePersonality(id: string): boolean {
        if (!this.config.personalities[id]) {
            return false;
        }

        // Set the active personality ID
        this.config.activePersonalityId = id;
        
        this.saveConfig();
        return true;
    }

    public clearActivePersonality(): void {
        this.config.activePersonalityId = undefined;
        this.saveConfig();
    }

    // Preset management
    public getPresets(): PersonalityPreset[] {
        return [...this.config.presets];
    }

    public createPersonalityFromPreset(presetName: string, customizations?: Partial<AIPersonality>): string | null {
        const preset = this.config.presets.find((p: PersonalityPreset) => p.name === presetName);
        if (!preset) {
            return null;
        }

        const personalityData = {
            ...preset.personality,
            ...customizations
        };

        return this.createPersonality(personalityData);
    }

    // Utility methods
    public getConfigFilePath(): string {
        return this.configFilePath;
    }

    public exportPersonality(id: string): AIPersonality | null {
        return this.getPersonality(id);
    }

    public importPersonality(personality: AIPersonality): string {
        // Generate new ID to avoid conflicts, remove the ID so createPersonality generates a new one
        const { id, ...personalityData } = personality;
        return this.createPersonality(personalityData);
    }

    private generateId(): string {
        return `personality_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Search and filter methods
    public searchPersonalities(query: string): AIPersonality[] {
        const searchLower = query.toLowerCase();
        return Object.values(this.config.personalities).filter((personality: AIPersonality) => 
            personality.name.toLowerCase().includes(searchLower) ||
            personality.description.toLowerCase().includes(searchLower) ||
            personality.tags.some((tag: string) => tag.toLowerCase().includes(searchLower)) ||
            personality.expertise.some((exp: string) => exp.toLowerCase().includes(searchLower))
        );
    }

    public getPersonalitiesByTag(tag: string): AIPersonality[] {
        return Object.values(this.config.personalities).filter((personality: AIPersonality) =>
            personality.tags.includes(tag)
        );
    }
} 