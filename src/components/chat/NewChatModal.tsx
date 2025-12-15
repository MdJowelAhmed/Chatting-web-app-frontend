'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usersApi } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { getInitials, getMediaUrl } from '@/lib/utils';
import type { User } from '@/types';

interface NewChatModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewChatModal({ open, onClose }: NewChatModalProps) {
  const { user } = useAuthStore();
  const { createOrGetConversation, setActiveConversation } = useChatStore();
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search) {
        fetchUsers(search);
      } else {
        fetchUsers();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = async (query?: string) => {
    setIsLoading(true);
    try {
      const response = await usersApi.getUsers(query);
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectUser = async (selectedUser: User) => {
    setIsCreating(true);
    try {
      const conversation = await createOrGetConversation(selectedUser._id);
      if (conversation) {
        setActiveConversation(conversation);
        onClose();
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface rounded-xl shadow-modal w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-primary">New Chat</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Search */}
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          {/* Users List */}
          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-text-secondary">No users found</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {users.map((u) => (
                  <button
                    key={u._id}
                    onClick={() => handleSelectUser(u)}
                    disabled={isCreating}
                    className="w-full p-4 flex items-center gap-3 hover:bg-surface-hover transition-colors disabled:opacity-50"
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={getMediaUrl(u.avatar)} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getInitials(u.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-text-primary">{u.name}</p>
                      <p className="text-sm text-text-secondary">{u.about}</p>
                    </div>
                    {u.isOnline && (
                      <span className="text-xs text-success">Online</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

