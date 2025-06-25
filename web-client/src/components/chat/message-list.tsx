'use client';

import React from 'react';
import { Message } from '@/store/chat-store';
import { MessageItem } from './message-item';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps): JSX.Element {
  if (messages.length === 0) {
    return <div />;
  }

  return (
    <div className="space-y-4 p-4">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  );
}