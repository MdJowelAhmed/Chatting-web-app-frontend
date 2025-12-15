'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useCallStore } from '@/store/callStore';
import { socketService } from '@/lib/socket';

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { isAuthenticated, token } = useAuthStore();
  const {
    addMessage,
    setTypingUser,
    removeTypingUser,
    setUserOnline,
    setUserOffline,
    updateMessage,
  } = useChatStore();
  const { setIncomingCall } = useCallStore();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketService.disconnect();
      return;
    }

    // Connect socket
    socketService.connect(token);

    // Set up event listeners
    const unsubscribeMessage = socketService.onNewMessage((message) => {
      addMessage(message.conversation as string, message);
    });

    const unsubscribeTyping = socketService.onUserTyping(({ conversationId, userId, userName }) => {
      setTypingUser(conversationId, { id: userId, name: userName });
    });

    const unsubscribeStopTyping = socketService.onUserStoppedTyping(({ conversationId, userId }) => {
      removeTypingUser(conversationId, userId);
    });

    const unsubscribeOnline = socketService.onUserOnline(({ userId }) => {
      setUserOnline(userId);
    });

    const unsubscribeOffline = socketService.onUserOffline(({ userId }) => {
      setUserOffline(userId);
    });

    const unsubscribeMessageStatus = socketService.onMessageStatusUpdate(({ messageId, status }) => {
      // Find the conversation and update the message
      // This is a simplified version - in production, you'd want to track the conversation ID
    });

    const unsubscribeMessagesRead = socketService.onMessagesRead(({ conversationId, userId }) => {
      // Update messages in that conversation to 'read' status
    });

    const unsubscribeIncomingCall = socketService.onIncomingCallSignal((data) => {
      setIncomingCall({
        call: {
          _id: data.callId || '',
          roomId: data.callId || '',
          type: data.callType || 'audio',
          status: 'ringing',
          caller: {
            _id: data.from,
            name: data.callerName || 'Unknown',
            avatar: data.callerAvatar || '',
          } as any,
          participants: [],
          isGroupCall: false,
          duration: 0,
          conversation: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        caller: {
          _id: data.from,
          name: data.callerName || 'Unknown',
          avatar: data.callerAvatar || '',
        },
      });
    });

    // Cleanup on unmount
    return () => {
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeStopTyping();
      unsubscribeOnline();
      unsubscribeOffline();
      unsubscribeMessageStatus();
      unsubscribeMessagesRead();
      unsubscribeIncomingCall();
    };
  }, [isAuthenticated, token]);

  return <>{children}</>;
}

