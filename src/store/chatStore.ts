import { create } from 'zustand';
import type { Conversation, Message, User } from '@/types';
import { conversationsApi, messagesApi } from '@/lib/api';

interface TypingUser {
  id: string;
  name: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: Map<string, Message[]>;
  typingUsers: Map<string, TypingUser[]>;
  onlineUsers: Set<string>;
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  replyingTo: Message | null;
  searchQuery: string;
  
  // Actions
  fetchConversations: () => Promise<void>;
  setActiveConversation: (conversation: Conversation | null) => void;
  fetchMessages: (conversationId: string, page?: number) => Promise<void>;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  setTypingUser: (conversationId: string, user: TypingUser) => void;
  removeTypingUser: (conversationId: string, userId: string) => void;
  setUserOnline: (userId: string) => void;
  setUserOffline: (userId: string) => void;
  updateConversationLastMessage: (conversationId: string, message: Message) => void;
  setReplyingTo: (message: Message | null) => void;
  setSearchQuery: (query: string) => void;
  createOrGetConversation: (userId: string) => Promise<Conversation | null>;
  createGroup: (name: string, participants: string[], description?: string) => Promise<Conversation | null>;
  markConversationAsRead: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: new Map(),
  typingUsers: new Map(),
  onlineUsers: new Set(),
  isLoadingConversations: false,
  isLoadingMessages: false,
  replyingTo: null,
  searchQuery: '',

  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const response = await conversationsApi.getConversations();
      if (response.success && response.data) {
        set({ conversations: response.data });
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation, replyingTo: null });
    if (conversation) {
      get().markConversationAsRead(conversation._id);
    }
  },

  fetchMessages: async (conversationId: string, page = 1) => {
    set({ isLoadingMessages: true });
    try {
      const response = await messagesApi.getMessages(conversationId, page);
      if (response.success && response.data) {
        const currentMessages = get().messages;
        const existingMessages = currentMessages.get(conversationId) || [];
        
        if (page === 1) {
          currentMessages.set(conversationId, response.data);
        } else {
          currentMessages.set(conversationId, [...response.data, ...existingMessages]);
        }
        
        set({ messages: new Map(currentMessages) });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      set({ isLoadingMessages: false });
    }
  },

  addMessage: (conversationId: string, message: Message) => {
    const currentMessages = get().messages;
    const conversationMessages = currentMessages.get(conversationId) || [];
    
    // Check if message already exists
    if (!conversationMessages.find((m) => m._id === message._id)) {
      currentMessages.set(conversationId, [...conversationMessages, message]);
      set({ messages: new Map(currentMessages) });
      
      // Update conversation's last message
      get().updateConversationLastMessage(conversationId, message);
    }
  },

  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => {
    const currentMessages = get().messages;
    const conversationMessages = currentMessages.get(conversationId) || [];
    
    const updatedMessages = conversationMessages.map((msg) =>
      msg._id === messageId ? { ...msg, ...updates } : msg
    );
    
    currentMessages.set(conversationId, updatedMessages);
    set({ messages: new Map(currentMessages) });
  },

  deleteMessage: (conversationId: string, messageId: string) => {
    const currentMessages = get().messages;
    const conversationMessages = currentMessages.get(conversationId) || [];
    
    const filteredMessages = conversationMessages.filter((msg) => msg._id !== messageId);
    currentMessages.set(conversationId, filteredMessages);
    set({ messages: new Map(currentMessages) });
  },

  setTypingUser: (conversationId: string, user: TypingUser) => {
    const currentTyping = get().typingUsers;
    const conversationTyping = currentTyping.get(conversationId) || [];
    
    if (!conversationTyping.find((u) => u.id === user.id)) {
      currentTyping.set(conversationId, [...conversationTyping, user]);
      set({ typingUsers: new Map(currentTyping) });
    }
  },

  removeTypingUser: (conversationId: string, userId: string) => {
    const currentTyping = get().typingUsers;
    const conversationTyping = currentTyping.get(conversationId) || [];
    
    currentTyping.set(
      conversationId,
      conversationTyping.filter((u) => u.id !== userId)
    );
    set({ typingUsers: new Map(currentTyping) });
  },

  setUserOnline: (userId: string) => {
    const onlineUsers = get().onlineUsers;
    onlineUsers.add(userId);
    set({ onlineUsers: new Set(onlineUsers) });
    
    // Update in conversations
    const conversations = get().conversations.map((conv) => {
      const updatedParticipants = conv.participants.map((p) =>
        p._id === userId ? { ...p, isOnline: true } : p
      );
      return { ...conv, participants: updatedParticipants };
    });
    set({ conversations });
  },

  setUserOffline: (userId: string) => {
    const onlineUsers = get().onlineUsers;
    onlineUsers.delete(userId);
    set({ onlineUsers: new Set(onlineUsers) });
    
    // Update in conversations
    const conversations = get().conversations.map((conv) => {
      const updatedParticipants = conv.participants.map((p) =>
        p._id === userId ? { ...p, isOnline: false, lastSeen: new Date().toISOString() } : p
      );
      return { ...conv, participants: updatedParticipants };
    });
    set({ conversations });
  },

  updateConversationLastMessage: (conversationId: string, message: Message) => {
    const conversations = get().conversations.map((conv) =>
      conv._id === conversationId
        ? { ...conv, lastMessage: message, updatedAt: message.createdAt }
        : conv
    );
    
    // Sort by last message time
    conversations.sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    set({ conversations });
  },

  setReplyingTo: (message) => {
    set({ replyingTo: message });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  createOrGetConversation: async (userId: string) => {
    try {
      const response = await conversationsApi.getOrCreatePrivate(userId);
      if (response.success && response.data) {
        const conversation = response.data;
        
        // Add to conversations if not exists
        const conversations = get().conversations;
        if (!conversations.find((c) => c._id === conversation._id)) {
          set({ conversations: [conversation, ...conversations] });
        }
        
        return conversation;
      }
      return null;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  },

  createGroup: async (name: string, participants: string[], description?: string) => {
    try {
      const response = await conversationsApi.createGroup(name, participants, description);
      if (response.success && response.data) {
        const conversation = response.data;
        set({ conversations: [conversation, ...get().conversations] });
        return conversation;
      }
      return null;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  },

  markConversationAsRead: (conversationId: string) => {
    const conversations = get().conversations.map((conv) =>
      conv._id === conversationId ? { ...conv, unreadCount: 0 } : conv
    );
    set({ conversations });
    
    // Also call API
    messagesApi.markAsRead(conversationId).catch(console.error);
  },
}));

