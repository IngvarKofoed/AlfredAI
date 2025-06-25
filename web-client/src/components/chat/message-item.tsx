'use client';

import React from 'react';
import { Message } from '@/store/chat-store';
import { MessageContent } from './message-content';
import { ToolCallsList } from './tool-calls-list';
import { formatTimestamp } from '@/lib/utils';
import { User, Brain, AlertCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps): JSX.Element {
  const getIcon = (): React.ReactNode => {
    switch (message.type) {
      case 'user':
        return <User className="h-4 w-4" />;
      case 'assistant':
        return <Brain className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getAvatarColor = (): string => {
    switch (message.type) {
      case 'user':
        return 'bg-blue-500';
      case 'assistant':
        return 'bg-primary';
      case 'error':
        return 'bg-destructive';
      case 'system':
        return 'bg-muted-foreground';
      default:
        return 'bg-primary';
    }
  };

  const getName = (): string => {
    switch (message.type) {
      case 'user':
        return 'You';
      case 'assistant':
        return 'Alfred AI';
      case 'error':
        return 'Error';
      case 'system':
        return 'System';
      default:
        return 'Alfred AI';
    }
  };

  return (
    <div className={cn('flex items-start gap-3 message-enter', {
      'opacity-75': message.type === 'system',
    })}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white',
        getAvatarColor()
      )}>
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-medium">{getName()}</span>
          <span className="text-xs text-muted-foreground">
            {formatTimestamp(message.timestamp)}
          </span>
        </div>

        {/* Message Content */}
        <div className={cn({
          'text-destructive': message.type === 'error',
          'text-muted-foreground': message.type === 'system',
        })}>
          <MessageContent content={message.content} />
        </div>

        {/* Tool Calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mt-3">
            <ToolCallsList toolCalls={message.toolCalls} />
          </div>
        )}
      </div>
    </div>
  );
}