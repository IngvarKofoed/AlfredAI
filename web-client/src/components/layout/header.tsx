'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chat-store';
import { useConnectionStore } from '@/store/connection-store';
import { Menu, Plus, Settings, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Header(): JSX.Element {
  const { toggleSidebar, createSession, sidebarOpen } = useChatStore();
  const { isConnected, status, serverInfo } = useConnectionStore();

  const handleNewChat = (): void => {
    createSession();
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 min-h-[64px]">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Sidebar Toggle - Always visible, better mobile UX */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="flex-shrink-0 touch-manipulation"
          aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Logo and Title */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground font-bold text-sm">AI</span>
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-lg font-semibold leading-none truncate">Alfred AI</h1>
            <span className="text-xs text-muted-foreground truncate hidden sm:block">
              {serverInfo.currentPersonality || 'Assistant'}
              {serverInfo.currentProvider && ` • ${serverInfo.currentProvider}`}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Connection Status - Simplified on mobile */}
        <div className="flex items-center gap-2 text-sm">
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs',
              isConnected
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            )}
          >
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                <span className="hidden sm:inline">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {status === 'connecting' ? 'Connecting...' : 'Disconnected'}
                </span>
              </>
            )}
          </div>
        </div>

        {/* New Chat Button - Mobile friendly */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNewChat}
          className="hidden sm:flex touch-manipulation"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        
        {/* Mobile New Chat Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNewChat}
          className="sm:hidden touch-manipulation"
          aria-label="New chat"
        >
          <Plus className="h-5 w-5" />
        </Button>

        {/* Settings Button */}
        <Button 
          variant="ghost" 
          size="icon"
          className="touch-manipulation"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}