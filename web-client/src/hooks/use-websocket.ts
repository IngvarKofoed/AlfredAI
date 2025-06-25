'use client';

import { useEffect } from 'react';
import { useConnectionStore } from '@/store/connection-store';
import { useToast } from '@/hooks/use-toast';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

export function useWebSocket(): void {
  const { connect, status } = useConnectionStore();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const initializeConnection = async (): Promise<void> => {
      if (status === 'disconnected' && mounted) {
        try {
          await connect(WS_URL);
          if (mounted) {
            toast({
              title: 'Connected',
              description: 'Successfully connected to Alfred AI server',
            });
          }
        } catch (error) {
          if (mounted) {
            console.error('Failed to connect to WebSocket:', error);
            toast({
              title: 'Connection Failed',
              description: 'Could not connect to Alfred AI server',
              variant: 'destructive',
            });
          }
        }
      }
    };

    // Initial connection attempt
    initializeConnection();

    return () => {
      mounted = false;
    };
  }, [connect, status, toast]);
}