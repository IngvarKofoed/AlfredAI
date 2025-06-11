/**
 * Memory Tool Usage Examples
 * 
 * This file contains practical examples of how to use the Memory MCP Tool
 * for active memory management during AI conversations.
 */

import { memoryTool } from './memory-tool';

/**
 * Example usage scenarios for the Memory MCP Tool
 */
export const memoryToolExamples = {
  
  /**
   * Basic Memory Operations
   */
  basicOperations: {
    
    // Remember a user preference
    rememberPreference: async () => {
      return await memoryTool.execute({
        action: 'remember',
        content: 'User prefers TypeScript over JavaScript for new projects',
        type: 'preference',
        tags: 'programming,language-preference,typescript',
        source: 'user'
      });
    },

    // Remember a fact about the user
    rememberFact: async () => {
      return await memoryTool.execute({
        action: 'remember',
        content: 'User is a senior software engineer with 8 years of experience',
        type: 'fact',
        tags: 'user-info,experience,career',
        source: 'user'
      });
    },

    // Remember a user goal
    rememberGoal: async () => {
      return await memoryTool.execute({
        action: 'remember',
        content: 'User wants to learn React Native for mobile development',
        type: 'goal',
        tags: 'learning,react-native,mobile,development',
        source: 'user'
      });
    },

    // Recall a specific memory
    recallMemory: async (memoryId: string) => {
      return await memoryTool.execute({
        action: 'recall',
        id: memoryId
      });
    },

    // List recent memories
    listRecentMemories: async () => {
      return await memoryTool.execute({
        action: 'list',
        limit: '10'
      });
    }
  },

  /**
   * Search Operations
   */
  searchOperations: {
    
    // Search by content
    searchByContent: async () => {
      return await memoryTool.execute({
        action: 'search',
        query: 'TypeScript programming',
        limit: '5'
      });
    },

    // Search by type
    searchPreferences: async () => {
      return await memoryTool.execute({
        action: 'search',
        type: 'preference',
        limit: '10'
      });
    },

    // Search by tags
    searchByTags: async () => {
      return await memoryTool.execute({
        action: 'search',
        tags: 'programming,typescript',
        limit: '5'
      });
    },

    // Complex search with multiple criteria
    complexSearch: async () => {
      return await memoryTool.execute({
        action: 'search',
        query: 'project',
        type: 'fact',
        tags: 'react,typescript',
        source: 'user',
        limit: '5'
      });
    }
  },

  /**
   * Memory Management
   */
  memoryManagement: {
    
    // Update a memory
    updateMemory: async (memoryId: string) => {
      return await memoryTool.execute({
        action: 'update',
        id: memoryId,
        content: 'User prefers TypeScript and is currently learning React Native',
        tags: 'programming,typescript,react-native,learning'
      });
    },

    // Delete a memory
    forgetMemory: async (memoryId: string) => {
      return await memoryTool.execute({
        action: 'forget',
        id: memoryId
      });
    },

    // Get memory statistics
    getStats: async () => {
      return await memoryTool.execute({
        action: 'stats'
      });
    }
  },

  /**
   * Advanced Usage with Metadata
   */
  advancedUsage: {
    
    // Remember with rich metadata
    rememberWithMetadata: async () => {
      return await memoryTool.execute({
        action: 'remember',
        content: 'User is working on an e-commerce project using Next.js and Stripe',
        type: 'fact',
        tags: 'project,nextjs,stripe,ecommerce',
        source: 'user',
        conversationId: 'conv_20231106_001',
        metadata: JSON.stringify({
          importance: 'high',
          project: 'current',
          technologies: ['Next.js', 'Stripe', 'TypeScript'],
          status: 'in-progress'
        })
      });
    },

    // Search with conversation context
    searchByConversation: async () => {
      return await memoryTool.execute({
        action: 'search',
        conversationId: 'conv_20231106_001',
        limit: '10'
      });
    }
  },

  /**
   * Conversation-Driven Memory Creation
   */
  conversationMemories: {
    
    // Remember user's coding style preferences
    rememberCodingStyle: async () => {
      return await memoryTool.execute({
        action: 'remember',
        content: 'User prefers functional programming patterns and uses ESLint with Prettier',
        type: 'preference',
        tags: 'coding-style,functional-programming,eslint,prettier',
        source: 'user'
      });
    },

    // Remember project context
    rememberProjectContext: async () => {
      return await memoryTool.execute({
        action: 'remember',
        content: 'Current project: Building a task management app with React, Node.js, and PostgreSQL',
        type: 'fact',
        tags: 'project,react,nodejs,postgresql,task-management',
        source: 'user',
        metadata: JSON.stringify({
          projectType: 'web-application',
          stack: 'full-stack',
          database: 'PostgreSQL',
          frontend: 'React',
          backend: 'Node.js'
        })
      });
    },

    // Remember learning goals
    rememberLearningGoals: async () => {
      return await memoryTool.execute({
        action: 'remember',
        content: 'User wants to learn Docker containerization and Kubernetes orchestration',
        type: 'goal',
        tags: 'learning,docker,kubernetes,devops,containerization',
        source: 'user'
      });
    }
  },

  /**
   * Memory Evolution Examples
   */
  memoryEvolution: {
    
    // Update project status
    updateProjectStatus: async (memoryId: string) => {
      return await memoryTool.execute({
        action: 'update',
        id: memoryId,
        content: 'Task management app project completed and deployed to production',
        metadata: JSON.stringify({
          status: 'completed',
          deployedAt: new Date().toISOString(),
          url: 'https://taskapp.example.com'
        })
      });
    },

    // Evolve learning progress
    updateLearningProgress: async (memoryId: string) => {
      return await memoryTool.execute({
        action: 'update',
        id: memoryId,
        content: 'User has completed Docker basics and is now learning Kubernetes deployment strategies',
        tags: 'learning,docker,kubernetes,devops,containerization,completed'
      });
    }
  }
};

/**
 * Demonstration workflow showing how memories evolve during a conversation
 */
export const demonstrationWorkflow = {
  
  async runCompleteWorkflow() {
    console.log('🧠 Memory Tool Demonstration Workflow');
    console.log('=====================================\n');

    try {
      // Step 1: Remember initial user information
      console.log('Step 1: Remembering user information...');
      const userInfo = await memoryToolExamples.basicOperations.rememberFact();
      console.log('✅ User info remembered:', userInfo);

      // Step 2: Remember user preferences
      console.log('\nStep 2: Remembering user preferences...');
      const preference = await memoryToolExamples.basicOperations.rememberPreference();
      console.log('✅ Preference remembered:', preference);

      // Step 3: Remember user goals
      console.log('\nStep 3: Remembering user goals...');
      const goal = await memoryToolExamples.basicOperations.rememberGoal();
      console.log('✅ Goal remembered:', goal);

      // Step 4: Search for programming-related memories
      console.log('\nStep 4: Searching for programming memories...');
      const searchResults = await memoryToolExamples.searchOperations.searchByTags();
      console.log('✅ Search results:', searchResults);

      // Step 5: Get memory statistics
      console.log('\nStep 5: Getting memory statistics...');
      const stats = await memoryToolExamples.memoryManagement.getStats();
      console.log('✅ Memory stats:', stats);

      // Step 6: List recent memories
      console.log('\nStep 6: Listing recent memories...');
      const recentMemories = await memoryToolExamples.basicOperations.listRecentMemories();
      console.log('✅ Recent memories:', recentMemories);

      console.log('\n🎉 Workflow completed successfully!');
      
    } catch (error) {
      console.error('❌ Workflow failed:', error);
    }
  }
};

/**
 * Best practices for using the Memory Tool
 */
export const bestPractices = {
  
  memoryTypes: {
    fact: 'Use for objective information about the user, their work, or context',
    preference: 'Use for user preferences, settings, and choices',
    goal: 'Use for user objectives, aspirations, and targets',
    'short-term': 'Use for temporary information relevant to current conversation',
    'long-term': 'Use for persistent information that should be retained across sessions'
  },

  tagging: {
    guidelines: [
      'Use descriptive, lowercase tags separated by commas',
      'Include technology names, domains, and categories',
      'Add context tags like "current", "completed", "learning"',
      'Use consistent naming conventions across memories'
    ],
    examples: [
      'programming,typescript,react,frontend',
      'project,ecommerce,nextjs,stripe,current',
      'learning,docker,kubernetes,devops,goal'
    ]
  },

  metadata: {
    guidelines: [
      'Use JSON format for structured metadata',
      'Include importance levels, project status, dates',
      'Add contextual information that aids retrieval',
      'Keep metadata concise but informative'
    ],
    examples: [
      '{"importance": "high", "status": "active"}',
      '{"project": "current", "deadline": "2023-12-01"}',
      '{"skill_level": "beginner", "priority": "medium"}'
    ]
  },

  searchStrategies: [
    'Use specific queries for targeted results',
    'Combine multiple search criteria for precision',
    'Use tags for categorical searches',
    'Leverage type filtering for organized retrieval',
    'Use pagination for large result sets'
  ]
};