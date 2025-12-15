'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  MessageSquarePlus,
  Users,
  Settings,
  LogOut,
  MoreVertical,
  Phone,
  Circle,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { NewChatModal } from './NewChatModal';
import { NewGroupModal } from './NewGroupModal';
import {
  formatChatListTime,
  getConversationName,
  getConversationAvatar,
  isUserOnline,
  getInitials,
  truncateText,
  getMediaUrl,
} from '@/lib/utils';
import type { Conversation } from '@/types';

interface ChatSidebarProps {
  onSelectConversation: () => void;
}

export function ChatSidebar({ onSelectConversation }: ChatSidebarProps) {
  const { user, logout } = useAuthStore();
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    searchQuery,
    setSearchQuery,
    typingUsers,
  } = useChatStore();
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true;
    const name = getConversationName(conv, user?._id || '');
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    onSelectConversation();
  };

  const getTypingText = (conversationId: string) => {
    const typing = typingUsers.get(conversationId);
    if (!typing || typing.length === 0) return null;
    if (typing.length === 1) return `${typing[0].name} is typing...`;
    return `${typing.length} people are typing...`;
  };

  const getLastMessagePreview = (conv: Conversation) => {
    if (!conv.lastMessage) return 'No messages yet';
    
    const msg = conv.lastMessage;
    if (msg.isDeletedForEveryone) return '🚫 This message was deleted';
    
    switch (msg.type) {
      case 'image':
        return '📷 Photo';
      case 'video':
        return '🎬 Video';
      case 'audio':
        return '🎵 Audio';
      case 'voice':
        return '🎤 Voice message';
      case 'document':
        return '📄 Document';
      default:
        return truncateText(msg.content, 40);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface w-full">
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getMediaUrl(user?.avatar || '')} />
            <AvatarFallback className="bg-primary/20 text-primary">
              {getInitials(user?.name || 'U')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold text-text-primary">{user?.name}</h1>
            <p className="text-xs text-text-secondary">{user?.about}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNewGroup(true)}
            className="text-text-secondary hover:text-text-primary"
          >
            <Users className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowNewChat(true)}
            className="text-text-secondary hover:text-text-primary"
          >
            <MessageSquarePlus className="h-5 w-5" />
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMenu(!showMenu)}
              className="text-text-secondary hover:text-text-primary"
            >
              <MoreVertical className="h-5 w-5" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-surface border border-border rounded-lg shadow-modal z-50">
                <button
                  className="w-full px-4 py-3 text-left text-sm text-text-primary hover:bg-surface-hover flex items-center gap-2"
                  onClick={() => {
                    setShowMenu(false);
                  }}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
                <button
                  className="w-full px-4 py-3 text-left text-sm text-danger hover:bg-surface-hover flex items-center gap-2"
                  onClick={() => {
                    logout();
                    setShowMenu(false);
                  }}
                >
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
          <Input
            placeholder="Search or start new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background-light border-0"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border/50">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-text-secondary">No conversations yet</p>
              <Button
                variant="link"
                onClick={() => setShowNewChat(true)}
                className="mt-2"
              >
                Start a new chat
              </Button>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const isActive = activeConversation?._id === conversation._id;
              const name = getConversationName(conversation, user?._id || '');
              const avatar = getConversationAvatar(conversation, user?._id || '');
              const online = isUserOnline(conversation, user?._id || '');
              const typingText = getTypingText(conversation._id);

              return (
                <motion.button
                  key={conversation._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-surface-hover transition-colors ${
                    isActive ? 'bg-surface-hover' : ''
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getMediaUrl(avatar)} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {conversation.type === 'group' ? (
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

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary truncate">
                        {name}
                      </span>
                      {conversation.lastMessage && (
                        <span className="text-xs text-text-secondary">
                          {formatChatListTime(conversation.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className={`text-sm truncate ${typingText ? 'text-primary' : 'text-text-secondary'}`}>
                        {typingText || getLastMessagePreview(conversation)}
                      </p>
                      {conversation.unreadCount > 0 && (
                        <span className="ml-2 bg-primary text-white text-xs font-medium rounded-full px-2 py-0.5 min-w-[20px] text-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.button>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Modals */}
      <NewChatModal open={showNewChat} onClose={() => setShowNewChat(false)} />
      <NewGroupModal open={showNewGroup} onClose={() => setShowNewGroup(false)} />
    </div>
  );
}

