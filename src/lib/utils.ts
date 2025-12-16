import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMessageTime(date: string | Date): string {
  const d = new Date(date);
  return format(d, 'HH:mm');
}

export function formatChatListTime(date: string | Date): string {
  const d = new Date(date);
  
  if (isToday(d)) {
    return format(d, 'HH:mm');
  }
  
  if (isYesterday(d)) {
    return 'Yesterday';
  }
  
  return format(d, 'dd/MM/yyyy');
}

export function formatLastSeen(date: string | Date): string {
  const d = new Date(date);
  
  if (isToday(d)) {
    return `today at ${format(d, 'HH:mm')}`;
  }
  
  if (isYesterday(d)) {
    return `yesterday at ${format(d, 'HH:mm')}`;
  }
  
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatCallDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️';
  if (mimeType.includes('zip') || mimeType.includes('rar')) return '🗜️';
  return '📁';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getConversationName(conversation: any, currentUserId: string): string {
  if (conversation.type === 'group') {
    return conversation.groupName || 'Group';
  }
  
  const otherUser = conversation.participants?.find(
    (p: any) => p._id !== currentUserId
  );
  
  return otherUser?.name || 'Unknown';
}

export function getConversationAvatar(conversation: any, currentUserId: string): string {
  if (conversation.type === 'group') {
    return conversation.groupAvatar || '';
  }
  
  const otherUser = conversation.participants?.find(
    (p: any) => p._id !== currentUserId
  );
  
  return otherUser?.avatar || '';
}

export function isUserOnline(conversation: any, currentUserId: string): boolean {
  if (conversation.type === 'group') return false;
  
  const otherUser = conversation.participants?.find(
    (p: any) => p._id !== currentUserId
  );
  
  return otherUser?.isOnline || false;
}

export function getOtherUser(conversation: any, currentUserId: string): any {
  if (conversation.type === 'group') return null;
  
  return conversation.participants?.find(
    (p: any) => p._id !== currentUserId
  );
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

export function getMediaUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Remove leading 'uploads/' if present to avoid duplication
  const cleanPath = path.startsWith('uploads/') ? path.substring(8) : path;
  return `${API_URL}/uploads/${cleanPath}`;
}

