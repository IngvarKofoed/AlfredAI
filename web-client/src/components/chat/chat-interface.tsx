'use client';

import React, { useEffect, useRef } from 'react';
import { useChatStore } from '@/store/chat-store';
import { useConnectionStore } from '@/store/connection-store';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { ThinkingIndicator } from './thinking-indicator';
import { WelcomeScreen } from './welcome-screen';
import { useWebSocket } from '@/hooks/use-websocket';

export function ChatInterface(): JSX.Element {
  const { messages, thinking, currentSessionId, createSession } = useChatStore();
  const { isConnected } = useConnectionStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize WebSocket connection
  useWebSocket();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  // Create initial session if none exists
  useEffect(() => {
    if (!currentSessionId && isConnected) {
      createSession();
    }
  }, [currentSessionId, isConnected, createSession]);

  const showWelcome = messages.length === 0 && !thinking;

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {showWelcome ? (
          <WelcomeScreen />
        ) : (
          <div className="max-w-4xl mx-auto px-2 sm:px-4">
            <MessageList messages={messages} />
            {thinking && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="border-t border-border bg-background">
        <div className="max-w-4xl mx-auto">
          <ChatInput />
        </div>
      </div>
    </div>
  );
}