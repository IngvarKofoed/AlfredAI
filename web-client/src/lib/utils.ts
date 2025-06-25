import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(date: Date | string | number): string {
  const now = new Date();
  const dateObj = date instanceof Date ? date : new Date(date);
  const diff = now.getTime() - dateObj.getTime();
  
  // Less than a minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  
  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  // Less than a week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }
  
  // Older than a week
  return date.toLocaleDateString();
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateSessionTitle(firstMessage: string): string {
  // Extract meaningful title from first message
  const cleaned = firstMessage.trim().replace(/\n+/g, ' ');
  return truncateText(cleaned, 50) || 'New Chat';
}

export function isCommand(text: string): boolean {
  return text.startsWith('/');
}

export function parseCommand(text: string): { command: string; args: string[] } {
  const parts = text.slice(1).split(' ');
  return {
    command: parts[0] || '',
    args: parts.slice(1),
  };
}