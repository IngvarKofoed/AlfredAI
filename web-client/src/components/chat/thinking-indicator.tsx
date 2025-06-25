'use client';

import React from 'react';
import { Brain } from 'lucide-react';

export function ThinkingIndicator(): JSX.Element {
  return (
    <div className="flex items-start gap-3 p-4 message-enter">
      {/* Avatar */}
      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
        <Brain className="h-4 w-4 text-primary-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Alfred AI</span>
          <span className="text-xs text-muted-foreground">thinking...</span>
        </div>
        
        <div className="bg-muted rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="thinking-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
            <span className="text-sm text-muted-foreground">Processing your request</span>
          </div>
        </div>
      </div>
    </div>
  );
}