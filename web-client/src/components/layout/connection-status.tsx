'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { useConnectionStore } from '@/store/connection-store';
import { AlertCircle, RefreshCw, Wifi } from 'lucide-react';

export function ConnectionStatus(): JSX.Element {
  const { status, error, reconnect, connect } = useConnectionStore();

  const handleReconnect = async (): Promise<void> => {
    try {
      await reconnect();
    } catch (error) {
      console.error('Failed to reconnect:', error);
    }
  };

  const handleConnect = async (): Promise<void> => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
      <div className="flex items-center gap-2 text-sm">
        <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        <span className="text-yellow-800 dark:text-yellow-200">
          {status === 'connecting' 
            ? 'Connecting to Alfred AI server...'
            : error || 'Disconnected from server'
          }
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {status === 'connecting' ? (
          <RefreshCw className="h-4 w-4 animate-spin text-yellow-600 dark:text-yellow-400" />
        ) : (
          <Button
            size="sm"
            variant="outline"
            onClick={status === 'error' ? handleConnect : handleReconnect}
            className="h-7 px-3 text-xs border-yellow-300 dark:border-yellow-600"
          >
            <Wifi className="h-3 w-3 mr-1" />
            {status === 'error' ? 'Connect' : 'Reconnect'}
          </Button>
        )}
      </div>
    </div>
  );
}