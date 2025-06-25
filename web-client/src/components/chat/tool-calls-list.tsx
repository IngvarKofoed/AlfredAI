'use client';

import React, { useState } from 'react';
import { ToolCall } from '@/store/chat-store';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Wrench, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCallsListProps {
  toolCalls: ToolCall[];
}

export function ToolCallsList({ toolCalls }: ToolCallsListProps): JSX.Element {
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());

  const toggleExpanded = (toolCallId: string): void => {
    setExpandedCalls(prev => {
      const newSet = new Set(prev);
      if (newSet.has(toolCallId)) {
        newSet.delete(toolCallId);
      } else {
        newSet.add(toolCallId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: ToolCall['status']): React.ReactNode => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <Wrench className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: ToolCall['status']): string => {
    switch (status) {
      case 'success':
        return 'Completed';
      case 'error':
        return 'Failed';
      case 'pending':
        return 'Running...';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground font-medium mb-2">
        Tool Calls ({toolCalls.length})
      </div>
      
      {toolCalls.map((toolCall) => {
        const isExpanded = expandedCalls.has(toolCall.id);
        
        return (
          <div key={toolCall.id} className="border border-border rounded-lg bg-muted/30">
            {/* Header */}
            <Button
              variant="ghost"
              className="w-full justify-between p-3 h-auto"
              onClick={() => toggleExpanded(toolCall.id)}
            >
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono text-sm">{toolCall.name}</span>
                {getStatusIcon(toolCall.status)}
                <span className={cn('text-xs', {
                  'text-green-600': toolCall.status === 'success',
                  'text-red-600': toolCall.status === 'error',
                  'text-yellow-600': toolCall.status === 'pending',
                })}>
                  {getStatusText(toolCall.status)}
                </span>
              </div>
              
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-3">
                {/* Arguments */}
                {Object.keys(toolCall.arguments).length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Arguments:
                    </div>
                    <pre className="text-xs bg-background p-2 rounded border overflow-x-auto">
                      {JSON.stringify(toolCall.arguments, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Result */}
                {toolCall.result && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      Result:
                    </div>
                    <pre className="text-xs bg-background p-2 rounded border overflow-x-auto max-h-40">
                      {typeof toolCall.result === 'string' 
                        ? toolCall.result 
                        : JSON.stringify(toolCall.result, null, 2)
                      }
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}