'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useCallStore } from '@/store/callStore';
import { socketService } from '@/lib/socket';
import { useToast } from '@/hooks/use-toast';

interface SocketProviderProps {
  children: React.ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { isAuthenticated, token, user } = useAuthStore();
  const {
    addMessage,
    setTypingUser,
    removeTypingUser,
    setUserOnline,
    setUserOffline,
  } = useChatStore();
  const { 
    setIncomingCall, 
    isCallActive, 
    endCall,
    activeCall,
  } = useCallStore();
  const { toast } = useToast();

  // Handle incoming call signal
  const handleIncomingCallSignal = useCallback((data: {
    signal: RTCSessionDescriptionInit;
    from: string;
    callerName?: string;
    callerAvatar?: string;
    callType?: 'audio' | 'video';
    callId?: string;
  }) => {
    console.log('📞 Incoming call signal from:', data.from, data.callerName);
    
    // Don't show incoming call if already in a call
    if (isCallActive) {
      console.log('📵 Already in a call, sending busy signal');
      socketService.getSocket()?.emit('user-busy', {
        to: data.from,
        callId: data.callId,
      });
      return;
    }

    // Set incoming call data with the signal
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
          email: '',
          about: '',
          isOnline: true,
          lastSeen: '',
          contacts: [],
          blockedUsers: [],
          createdAt: '',
          updatedAt: '',
        },
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
      signal: data.signal,
    });

    // Show toast notification
    toast({
      title: `Incoming ${data.callType || 'audio'} call`,
      description: `${data.callerName || 'Someone'} is calling you`,
    });
  }, [isCallActive, setIncomingCall, toast]);

  // Handle call ended by remote user
  const handleCallEnded = useCallback(({ from, callId }: { from: string; callId: string }) => {
    console.log('📴 Call ended by:', from);
    
    // Only end if this is for our active call
    if (activeCall?._id === callId || !activeCall) {
      endCall();
      toast({
        title: 'Call Ended',
        description: 'The call has ended',
      });
    }
  }, [activeCall, endCall, toast]);

  // Handle call rejected
  const handleCallRejected = useCallback(({ from, callId }: { from: string; callId: string }) => {
    console.log('❌ Call rejected by:', from);
    
    endCall();
    toast({
      title: 'Call Declined',
      description: 'The user declined your call',
      variant: 'destructive',
    });
  }, [endCall, toast]);

  // Handle user busy
  const handleUserBusy = useCallback(({ from, callId }: { from: string; callId: string }) => {
    console.log('📵 User is busy:', from);
    
    endCall();
    toast({
      title: 'User Busy',
      description: 'The user is currently on another call',
      variant: 'destructive',
    });
  }, [endCall, toast]);

  // Handle user unavailable
  const handleUserUnavailable = useCallback(({ userId }: { userId: string }) => {
    console.log('📵 User unavailable:', userId);
    
    endCall();
    toast({
      title: 'User Unavailable',
      description: 'The user is currently offline',
      variant: 'destructive',
    });
  }, [endCall, toast]);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      socketService.disconnect();
      return;
    }

    // Connect socket
    console.log('🔌 Connecting socket...');
    socketService.connect(token);

    // ============ MESSAGE EVENTS ============
    const unsubscribeMessage = socketService.onNewMessage((message) => {
      addMessage(message.conversation as string, message);
    });

    const unsubscribeTyping = socketService.onUserTyping(({ conversationId, userId, userName }) => {
      setTypingUser(conversationId, { id: userId, name: userName });
    });

    const unsubscribeStopTyping = socketService.onUserStoppedTyping(({ conversationId, userId }) => {
      removeTypingUser(conversationId, userId);
    });

    // ============ PRESENCE EVENTS ============
    const unsubscribeOnline = socketService.onUserOnline(({ userId }) => {
      setUserOnline(userId);
    });

    const unsubscribeOffline = socketService.onUserOffline(({ userId }) => {
      setUserOffline(userId);
    });

    // ============ CALL EVENTS ============
    const unsubscribeIncomingCall = socketService.onIncomingCallSignal(handleIncomingCallSignal);
    const unsubscribeCallEnded = socketService.onCallEnded(handleCallEnded);
    const unsubscribeCallRejected = socketService.onCallRejected(handleCallRejected);
    const unsubscribeUserBusy = socketService.onUserBusy(handleUserBusy);
    const unsubscribeUserUnavailable = socketService.onUserUnavailable(handleUserUnavailable);

    // ============ MESSAGE STATUS EVENTS ============
    const unsubscribeMessageStatus = socketService.onMessageStatusUpdate(({ messageId, status }) => {
      // Update message status - can be implemented if needed
    });

    const unsubscribeMessagesRead = socketService.onMessagesRead(({ conversationId, userId }) => {
      // Update messages to read status - can be implemented if needed
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up socket listeners');
      unsubscribeMessage();
      unsubscribeTyping();
      unsubscribeStopTyping();
      unsubscribeOnline();
      unsubscribeOffline();
      unsubscribeMessageStatus();
      unsubscribeMessagesRead();
      unsubscribeIncomingCall();
      unsubscribeCallEnded();
      unsubscribeCallRejected();
      unsubscribeUserBusy();
      unsubscribeUserUnavailable();
    };
  }, [
    isAuthenticated,
    token,
    addMessage,
    setTypingUser,
    removeTypingUser,
    setUserOnline,
    setUserOffline,
    handleIncomingCallSignal,
    handleCallEnded,
    handleCallRejected,
    handleUserBusy,
    handleUserUnavailable,
  ]);

  return <>{children}</>;
}
