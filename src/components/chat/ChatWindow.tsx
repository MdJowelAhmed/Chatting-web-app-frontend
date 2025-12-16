'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Circle,
  Users,
  Ban,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ForwardMessageModal } from './ForwardMessageModal';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { useCallStore } from '@/store/callStore';
import { socketService } from '@/lib/socket';
import { callsApi, usersApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  getConversationName,
  getConversationAvatar,
  isUserOnline,
  getOtherUser,
  getInitials,
  formatLastSeen,
  getMediaUrl,
} from '@/lib/utils';
import type { Message } from '@/types';

interface ChatWindowProps {
  onBack: () => void;
}

export function ChatWindow({ onBack }: ChatWindowProps) {
  const { user } = useAuthStore();
  const {
    activeConversation,
    setActiveConversation,
    messages,
    fetchMessages,
    isLoadingMessages,
    typingUsers,
  } = useChatStore();
  const { startCall, setActiveCall } = useCallStore();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);

  const conversationMessages = messages.get(activeConversation?._id || '') || [];
  const typing = typingUsers.get(activeConversation?._id || '') || [];

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
      socketService.joinConversation(activeConversation._id);
      socketService.markMessagesRead(activeConversation._id);
    }

    return () => {
      if (activeConversation) {
        socketService.leaveConversation(activeConversation._id);
      }
    };
  }, [activeConversation?._id]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversationMessages.length]);

  const handleInitiateCall = async (type: 'audio' | 'video') => {
    if (!activeConversation) return;

    const otherUser = getOtherUser(activeConversation, user?._id || '');
    if (!otherUser) return;

    // Check if WebRTC is available (requires HTTPS or localhost)
    if (typeof window !== 'undefined') {
      const isSecureContext = window.isSecureContext;
      const isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
      
      if (!isSecureContext && !isLocalhost) {
        toast({
          title: 'Secure Connection Required',
          description: 'Video/audio calls require HTTPS. Please access the app via localhost:3004',
          variant: 'destructive',
        });
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: 'Not Supported',
          description: 'Your browser does not support video/audio calls. Please use Chrome, Firefox, or Edge.',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      // First, create the call via API
      const response = await callsApi.initiateCall(
        otherUser._id,
        type,
        activeConversation.type === 'group',
        activeConversation._id
      );
      
      if (response.success && response.data) {
        console.log('📞 Call initiated:', response.data._id);
        
        // Set active call data
        setActiveCall(response.data);
        
        // Start the call UI (this will trigger WebRTC initialization)
        startCall(type);
      } else {
        toast({
          title: 'Call Failed',
          description: 'Could not initiate the call',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error initiating call:', error);
      toast({
        title: 'Call Failed',
        description: 'An error occurred while starting the call',
        variant: 'destructive',
      });
    }
  };

  const handleBlockUser = async () => {
    if (!activeConversation || activeConversation.type === 'group') return;

    const otherUser = getOtherUser(activeConversation, user?._id || '');
    if (!otherUser) return;

    try {
      const response = await usersApi.blockUser(otherUser._id);
      if (response.success) {
        toast({
          title: 'User Blocked',
          description: `${otherUser.name} has been blocked successfully.`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to block user',
        variant: 'destructive',
      });
    }
  };

  const handleForwardMessage = (message: Message) => {
    setForwardMessage(message);
  };

  if (!activeConversation) return null;

  const name = getConversationName(activeConversation, user?._id || '');
  const avatar = getConversationAvatar(activeConversation, user?._id || '');
  const online = isUserOnline(activeConversation, user?._id || '');
  const otherUser = getOtherUser(activeConversation, user?._id || '');

  const getStatusText = () => {
    if (typing.length > 0) {
      return typing.length === 1 ? 'typing...' : `${typing.length} typing...`;
    }
    if (activeConversation.type === 'group') {
      return `${activeConversation.participants.length} participants`;
    }
    if (online) return 'online';
    if (otherUser?.lastSeen) {
      return `last seen ${formatLastSeen(otherUser.lastSeen)}`;
    }
    return '';
  };

  return (
    <div className="flex flex-col h-screen w-full">
      {/* Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-border bg-surface">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => {
              setActiveConversation(null);
              onBack();
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="relative cursor-pointer" onClick={() => setShowInfo(true)}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={getMediaUrl(avatar)} />
              <AvatarFallback className="bg-primary/20 text-primary">
                {activeConversation.type === 'group' ? (
                  <Users className="h-5 w-5" />
                ) : (
                  getInitials(name)
                )}
              </AvatarFallback>
            </Avatar>
            {online && (
              <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-success text-success" />
            )}
          </div>

          <div className="cursor-pointer" onClick={() => setShowInfo(true)}>
            <h2 className="font-semibold text-text-primary">{name}</h2>
            <p className={`text-xs ${typing.length > 0 ? 'text-primary' : 'text-text-secondary'}`}>
              {getStatusText()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleInitiateCall('video')}
            className="text-text-secondary hover:text-text-primary"
          >
            <Video className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleInitiateCall('audio')}
            className="text-text-secondary hover:text-text-primary"
          >
            <Phone className="h-5 w-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-text-secondary hover:text-text-primary"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {activeConversation.type !== 'group' && (
                <DropdownMenuItem
                  onClick={handleBlockUser}
                  className="text-danger focus:text-danger cursor-pointer"
                >
                  <Ban className="h-4 w-4 mr-2" />
                  Block User
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea
        ref={scrollRef}
        className="flex-1 bg-background-chat chat-bg-pattern"
      >
        <div className="p-4 space-y-1 min-h-full flex flex-col justify-end">
          {isLoadingMessages && conversationMessages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-text-secondary">Loading messages...</div>
            </div>
          ) : conversationMessages.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <p className="text-text-secondary">No messages yet</p>
                <p className="text-sm text-text-secondary/70">
                  Start the conversation by sending a message
                </p>
              </div>
            </div>
          ) : (
            conversationMessages.map((message, index) => {
              const showDate = index === 0 ||
                new Date(message.createdAt).toDateString() !==
                new Date(conversationMessages[index - 1].createdAt).toDateString();

              return (
                <div key={message._id}>
                  {showDate && (
                    <div className="flex justify-center my-4">
                      <span className="bg-surface px-3 py-1 rounded-lg text-xs text-text-secondary">
                        {new Date(message.createdAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  <MessageBubble
                    message={message}
                    isOwn={
                      typeof message.sender === 'string'
                        ? message.sender === user?._id
                        : message.sender._id === user?._id
                    }
                    showSender={activeConversation.type === 'group'}
                    onForward={handleForwardMessage}
                  />
                </div>
              );
            })
          )}

          {/* Typing Indicator */}
          {typing.length > 0 && <TypingIndicator users={typing} />}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <MessageInput conversationId={activeConversation._id} />

      {/* Forward Message Modal */}
      <ForwardMessageModal
        isOpen={forwardMessage !== null}
        onClose={() => setForwardMessage(null)}
        message={forwardMessage}
        currentUserId={user?._id || ''}
      />
    </div>
  );
}
