'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatStore } from '@/store/chat-store';
import { useConnectionStore } from '@/store/connection-store';
import { useWebSocketMessage } from '@/hooks/use-websocket-message';
import { Send, Square } from 'lucide-react';
import { cn, isCommand, parseCommand, generateSessionTitle } from '@/lib/utils';

export function ChatInput(): JSX.Element {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { 
    addMessage, 
    setThinking, 
    thinking, 
    currentSessionId,
    updateSessionTitle,
    sessions 
  } = useChatStore();
  const { isConnected, ws } = useConnectionStore();
  
  // Handle WebSocket messages
  useWebSocketMessage();

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Focus input when connected
  useEffect(() => {
    if (isConnected && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isConnected]);

  const sendMessage = async (content: string): Promise<void> => {
    if (!isConnected || !ws || !content.trim()) return;

    setIsSubmitting(true);
    
    try {
      // Add user message
      addMessage({
        type: 'user',
        content: content.trim(),
      });

      // Update session title if this is the first message
      const currentSession = sessions.find(s => s.id === currentSessionId);
      if (currentSession && currentSession.messages.length === 0) {
        const title = generateSessionTitle(content.trim());
        updateSessionTitle(currentSessionId!, title);
      }

      // Handle commands
      if (isCommand(content)) {
        const { command, args } = parseCommand(content);
        
        // Send command to server
        ws.send(JSON.stringify({
          type: 'command',
          command,
          args,
          timestamp: new Date().toISOString(),
        }));
      } else {
        // Send regular message
        ws.send(JSON.stringify({
          type: 'message',
          content: content.trim(),
          timestamp: new Date().toISOString(),
        }));
      }

      // Set thinking state
      setThinking(true);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      addMessage({
        type: 'error',
        content: 'Failed to send message. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (thinking) {
      // Stop current request
      if (ws) {
        ws.send(JSON.stringify({
          type: 'stop',
          timestamp: new Date().toISOString(),
        }));
      }
      setThinking(false);
      return;
    }

    const content = input.trim();
    if (!content) return;

    setInput('');
    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const isDisabled = !isConnected || isSubmitting;
  const placeholder = !isConnected 
    ? 'Connect to server to start chatting...'
    : thinking
    ? 'AI is responding...'
    : 'Type your message... (Enter to send, Shift+Enter for new line)';

  return (
    <div className="p-4 pb-safe">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex gap-3 items-end">
          {/* Text Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isDisabled}
              className={cn(
                'min-h-[56px] max-h-[200px] resize-none pr-12',
                'focus:ring-2 focus:ring-primary focus:border-transparent',
                'text-base', // Prevent zoom on iOS
                'touch-manipulation', // Improve touch responsiveness
                'rounded-xl border-2', // More prominent borders for mobile
                'leading-relaxed' // Better line height for readability
              )}
              rows={1}
            />
            
            {/* Character count (optional) */}
            {input.length > 500 && (
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background px-1 rounded">
                {input.length}
              </div>
            )}
          </div>

          {/* Send/Stop Button */}
          <Button
            type="submit"
            size="icon"
            disabled={isDisabled || (!input.trim() && !thinking)}
            className={cn(
              "h-[56px] w-[56px] flex-shrink-0",
              "touch-manipulation",
              "rounded-xl", // Match input styling
              "shadow-sm" // Subtle shadow for better visibility
            )}
          >
            {thinking ? (
              <Square className="h-6 w-6" />
            ) : (
              <Send className="h-6 w-6" />
            )}
          </Button>
        </div>

        {/* Help text - More compact on mobile */}
        <div className="mt-3 text-xs text-muted-foreground">
          {isCommand(input) ? (
            <span className="text-blue-600 dark:text-blue-400">
              Command detected. Available: /help, /clear, /personality, /provider
            </span>
          ) : (
            <span className="hidden sm:inline">
              Use <kbd className="bg-muted px-1 py-0.5 rounded text-xs">/help</kbd> for commands
            </span>
          )}
        </div>
      </form>
    </div>
  );
}