'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chat-store';
import { useConnectionStore } from '@/store/connection-store';
import { MessageSquare, Zap, Brain, Code, Wifi } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  {
    icon: Brain,
    title: 'Get help with thinking',
    prompt: 'Help me think through a complex problem step by step',
  },
  {
    icon: Code,
    title: 'Write some code',
    prompt: 'Write a React component that displays a list of items',
  },
  {
    icon: MessageSquare,
    title: 'Ask a question',
    prompt: 'What are the key principles of good software design?',
  },
  {
    icon: Zap,
    title: 'Creative writing',
    prompt: 'Write a short story about an AI assistant',
  },
];

export function WelcomeScreen(): JSX.Element {
  const { addMessage } = useChatStore();
  const { isConnected, serverInfo } = useConnectionStore();

  const handleExampleClick = (prompt: string): void => {
    if (isConnected) {
      addMessage({
        type: 'user',
        content: prompt,
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 sm:p-8 text-center">
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Welcome to Alfred AI
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg px-4">
            {isConnected ? (
              <>
                Connected to {serverInfo.currentPersonality || 'Assistant'}
                {serverInfo.currentProvider && (
                  <span className="block text-sm mt-1">
                    Using {serverInfo.currentProvider}
                  </span>
                )}
              </>
            ) : (
              'Connect to get started with your AI assistant'
            )}
          </p>
        </div>

        {/* Connection Status */}
        {!isConnected && (
          <div className="mb-8 p-4 bg-muted rounded-lg border border-border">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Wifi className="h-5 w-5" />
              <span>Waiting for connection...</span>
            </div>
          </div>
        )}

        {/* Example Prompts */}
        {isConnected && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {EXAMPLE_PROMPTS.map((example, index) => (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-start gap-2 text-left hover:bg-accent transition-colors touch-manipulation min-h-[80px]"
                onClick={() => handleExampleClick(example.prompt)}
              >
                <div className="flex items-center gap-2 w-full">
                  <example.icon className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">{example.title}</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  {example.prompt}
                </p>
              </Button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 sm:mt-8 text-xs sm:text-sm text-muted-foreground px-4">
          <p>
            Start typing in the input below or click one of the examples above.
          </p>
          <p className="mt-2 hidden sm:block">
            Use <code className="bg-muted px-1 py-0.5 rounded">/help</code> to see available commands.
          </p>
        </div>
      </div>
    </div>
  );
}