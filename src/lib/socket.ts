import { io, Socket } from 'socket.io-client';
import type { Message, TypingEvent, MessageReadEvent, OnlineStatusEvent, CallSignalEvent } from '@/types';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://10.10.7.62:5000';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('🟢 Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // ============ MESSAGING ============
  
  sendMessage(data: { conversationId: string; content: string; type?: string; replyTo?: string }): void {
    this.socket?.emit('send-message', data);
  }

  onNewMessage(callback: (message: Message) => void): () => void {
    this.socket?.on('new-message', callback);
    return () => this.socket?.off('new-message', callback);
  }

  // ============ TYPING INDICATORS ============

  startTyping(conversationId: string): void {
    this.socket?.emit('typing-start', { conversationId });
  }

  stopTyping(conversationId: string): void {
    this.socket?.emit('typing-stop', { conversationId });
  }

  onUserTyping(callback: (data: TypingEvent) => void): () => void {
    this.socket?.on('user-typing', callback);
    return () => this.socket?.off('user-typing', callback);
  }

  onUserStoppedTyping(callback: (data: { conversationId: string; userId: string }) => void): () => void {
    this.socket?.on('user-stopped-typing', callback);
    return () => this.socket?.off('user-stopped-typing', callback);
  }

  // ============ MESSAGE STATUS ============

  markMessagesRead(conversationId: string): void {
    this.socket?.emit('messages-read', { conversationId });
  }

  onMessagesRead(callback: (data: MessageReadEvent) => void): () => void {
    this.socket?.on('messages-read', callback);
    return () => this.socket?.off('messages-read', callback);
  }

  onMessageStatusUpdate(callback: (data: { messageId: string; status: string }) => void): () => void {
    this.socket?.on('message-status-update', callback);
    return () => this.socket?.off('message-status-update', callback);
  }

  onMessageDeleted(callback: (data: { messageId: string; conversationId: string }) => void): () => void {
    this.socket?.on('message-deleted', callback);
    return () => this.socket?.off('message-deleted', callback);
  }

  onMessageReaction(callback: (data: { messageId: string; reactions: any[] }) => void): () => void {
    this.socket?.on('message-reaction', callback);
    return () => this.socket?.off('message-reaction', callback);
  }

  // ============ ONLINE STATUS ============

  onUserOnline(callback: (data: OnlineStatusEvent) => void): () => void {
    this.socket?.on('user-online', callback);
    return () => this.socket?.off('user-online', callback);
  }

  onUserOffline(callback: (data: OnlineStatusEvent) => void): () => void {
    this.socket?.on('user-offline', callback);
    return () => this.socket?.off('user-offline', callback);
  }

  // ============ CONVERSATION MANAGEMENT ============

  joinConversation(conversationId: string): void {
    this.socket?.emit('join-conversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    this.socket?.emit('leave-conversation', { conversationId });
  }

  // ============ WEBRTC SIGNALING ============

  callUser(data: { userToCall: string; signalData: any; callType: 'audio' | 'video'; callId: string }): void {
    this.socket?.emit('call-user', data);
  }

  answerCall(data: { signal: any; to: string; callId: string }): void {
    this.socket?.emit('answer-call', data);
  }

  sendIceCandidate(data: { candidate: any; to: string }): void {
    this.socket?.emit('ice-candidate', data);
  }

  rejectCall(data: { to: string; callId: string }): void {
    this.socket?.emit('reject-call', data);
  }

  endCall(data: { to: string; callId: string }): void {
    this.socket?.emit('end-call', data);
  }

  onIncomingCallSignal(callback: (data: CallSignalEvent) => void): () => void {
    this.socket?.on('incoming-call-signal', callback);
    return () => this.socket?.off('incoming-call-signal', callback);
  }

  onCallAccepted(callback: (data: { signal: any; from: string; callId: string }) => void): () => void {
    this.socket?.on('call-accepted', callback);
    return () => this.socket?.off('call-accepted', callback);
  }

  onIceCandidate(callback: (data: { candidate: any; from: string }) => void): () => void {
    this.socket?.on('ice-candidate', callback);
    return () => this.socket?.off('ice-candidate', callback);
  }

  onCallRejected(callback: (data: { from: string; callId: string }) => void): () => void {
    this.socket?.on('call-rejected', callback);
    return () => this.socket?.off('call-rejected', callback);
  }

  onCallEnded(callback: (data: { from: string; callId: string }) => void): () => void {
    this.socket?.on('call-ended', callback);
    return () => this.socket?.off('call-ended', callback);
  }

  onUserBusy(callback: (data: { from: string; callId: string }) => void): () => void {
    this.socket?.on('user-busy', callback);
    return () => this.socket?.off('user-busy', callback);
  }

  onUserUnavailable(callback: (data: { userId: string }) => void): () => void {
    this.socket?.on('user-unavailable', callback);
    return () => this.socket?.off('user-unavailable', callback);
  }

  // ============ GROUP CALLS ============

  joinCallRoom(roomId: string): void {
    this.socket?.emit('join-call-room', { roomId });
  }

  leaveCallRoom(roomId: string): void {
    this.socket?.emit('leave-call-room', { roomId });
  }

  onUserJoinedCall(callback: (data: { userId: string; userName: string; userAvatar: string }) => void): () => void {
    this.socket?.on('user-joined-call', callback);
    return () => this.socket?.off('user-joined-call', callback);
  }

  onUserLeftCall(callback: (data: { userId: string; userName: string }) => void): () => void {
    this.socket?.on('user-left-call', callback);
    return () => this.socket?.off('user-left-call', callback);
  }

  // ============ SCREEN SHARING ============

  startScreenShare(data: { conversationId?: string; roomId?: string }): void {
    this.socket?.emit('screen-share-started', data);
  }

  stopScreenShare(data: { conversationId?: string; roomId?: string }): void {
    this.socket?.emit('screen-share-stopped', data);
  }

  onScreenShareStarted(callback: (data: { userId: string; userName: string }) => void): () => void {
    this.socket?.on('screen-share-started', callback);
    return () => this.socket?.off('screen-share-started', callback);
  }

  onScreenShareStopped(callback: (data: { userId: string }) => void): () => void {
    this.socket?.on('screen-share-stopped', callback);
    return () => this.socket?.off('screen-share-stopped', callback);
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;

