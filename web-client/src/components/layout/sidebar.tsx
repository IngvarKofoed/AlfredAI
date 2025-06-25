'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chat-store';
import { formatTimestamp, truncateText } from '@/lib/utils';
import { MessageSquare, Plus, Trash2, MoreHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps): JSX.Element {
  const {
    sessions,
    currentSessionId,
    createSession,
    setCurrentSession,
    deleteSession,
  } = useChatStore();

  // Close sidebar on mobile when clicking outside or on session select
  useEffect(() => {
    if (isMobile && onClose) {
      const handleEscapeKey = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [isMobile, onClose]);

  const handleNewChat = (): void => {
    createSession();
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleSessionSelect = (sessionId: string): void => {
    setCurrentSession(sessionId);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent): void => {
    e.stopPropagation();
    if (sessions.length > 1) {
      deleteSession(sessionId);
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-muted/30",
      isMobile && "relative"
    )}>
      {/* Mobile Header with Close Button */}
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      {/* Header */}
      <div className={cn(
        "p-4 border-b border-border",
        isMobile && "pt-2"
      )}>
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-2">
          {sessions.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              No conversations yet
            </div>
          ) : (
            <div className="space-y-1">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    'group flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent',
                    'touch-manipulation', // Improve touch responsiveness
                    currentSessionId === session.id
                      ? 'bg-accent border border-border'
                      : 'hover:bg-muted',
                    isMobile && 'min-h-[48px]' // Ensure minimum touch target size on mobile
                  )}
                  onClick={() => handleSessionSelect(session.id)}
                >
                  <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {truncateText(session.title, 25)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTimestamp(session.updatedAt)}
                      {session.messages.length > 0 && (
                        <span className="ml-1">
                          • {session.messages.length} messages
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className={cn(
                    "flex items-center gap-1 transition-opacity",
                    isMobile 
                      ? "opacity-100" // Always visible on mobile for better touch access
                      : "opacity-0 group-hover:opacity-100"
                  )}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "text-destructive hover:text-destructive",
                        isMobile ? "h-8 w-8" : "h-6 w-6" // Larger touch targets on mobile
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className={cn(
                        isMobile ? "h-4 w-4" : "h-3 w-3"
                      )} />
                    </Button>
                    
                    {sessions.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "text-destructive hover:text-destructive",
                          isMobile ? "h-8 w-8" : "h-6 w-6" // Larger touch targets on mobile
                        )}
                        onClick={(e) => handleDeleteSession(session.id, e)}
                      >
                        <Trash2 className={cn(
                          isMobile ? "h-4 w-4" : "h-3 w-3"
                        )} />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          Alfred AI Web Client
        </div>
      </div>
    </div>
  );
}