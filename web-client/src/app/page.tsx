'use client';

import { ChatInterface } from '@/components/chat/chat-interface';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { useChatStore } from '@/store/chat-store';
import { useConnectionStore } from '@/store/connection-store';
import { ConnectionStatus } from '@/components/layout/connection-status';
import { useEffect, useState, useRef } from 'react';

export default function HomePage(): JSX.Element {
  const { sidebarOpen, setSidebarOpen } = useChatStore();
  const { isConnected } = useConnectionStore();
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Ensure we're on the client side to prevent hydration issues
  useEffect(() => {
    setIsClient(true);
    const checkMobileSize = (): void => {
      const mobile = window.innerWidth < 1024; // lg breakpoint
      setIsMobile(mobile);
    };
    
    checkMobileSize();
    window.addEventListener('resize', checkMobileSize);
    return () => window.removeEventListener('resize', checkMobileSize);
  }, []);

  // Handle touch gestures for sidebar
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent): void => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = (e: TouchEvent): void => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      
      // Only process horizontal swipes (ignore vertical scrolling)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        // Swipe right from left edge to open sidebar
        if (deltaX > 0 && touchStartRef.current.x < 50 && !sidebarOpen) {
          setSidebarOpen(true);
        }
        // Swipe left to close sidebar
        else if (deltaX < -50 && sidebarOpen) {
          setSidebarOpen(false);
        }
      }

      touchStartRef.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isMobile, sidebarOpen, setSidebarOpen]);

  // Close sidebar on mobile when clicking outside
  const handleOverlayClick = (): void => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  // Show loading state during hydration
  if (!isClient) {
    return (
      <main className="flex h-screen bg-background overflow-hidden">
        <div className="w-0 border-r border-border bg-background transition-all">
          {/* Placeholder sidebar during hydration - closed by default */}
        </div>
        <div className="flex-1 flex flex-col">
          {/* Placeholder content during hydration */}
        </div>
      </main>
    );
  }

  return (
    <main className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          ${isMobile 
            ? `fixed left-0 top-0 z-50 h-full w-80 transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              } lg:relative lg:translate-x-0`
            : `${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 ease-in-out`
          } 
          border-r border-border overflow-hidden bg-background
        `}
      >
        <Sidebar 
          isMobile={isMobile} 
          onClose={() => setSidebarOpen(false)} 
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        {/* Connection Status Bar */}
        {!isConnected && <ConnectionStatus />}
        
        {/* Chat Interface */}
        <div className="flex-1 relative">
          <ChatInterface />
        </div>
      </div>
    </main>
  );
}