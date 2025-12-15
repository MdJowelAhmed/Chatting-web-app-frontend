'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader2, Check, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usersApi } from '@/lib/api';
import { useChatStore } from '@/store/chatStore';
import { getInitials, getMediaUrl } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { User } from '@/types';

interface NewGroupModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewGroupModal({ open, onClose }: NewGroupModalProps) {
  const { createGroup, setActiveConversation } = useChatStore();
  const [step, setStep] = useState<'select' | 'details'>('select');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
      setStep('select');
      setSelectedUsers([]);
      setGroupName('');
      setGroupDescription('');
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(search);
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

  const toggleUser = (user: User) => {
    setSelectedUsers((prev) =>
      prev.find((u) => u._id === user._id)
        ? prev.filter((u) => u._id !== user._id)
        : [...prev, user]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a group name',
        variant: 'destructive',
      });
      return;
    }

    if (selectedUsers.length < 2) {
      toast({
        title: 'Error',
        description: 'Please select at least 2 participants',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const conversation = await createGroup(
        groupName,
        selectedUsers.map((u) => u._id),
        groupDescription
      );
      if (conversation) {
        setActiveConversation(conversation);
        toast({
          title: 'Success',
          description: 'Group created successfully',
          variant: 'success',
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create group',
        variant: 'destructive',
      });
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
            <h2 className="text-lg font-semibold text-text-primary">
              {step === 'select' ? 'Add Participants' : 'Group Details'}
            </h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {step === 'select' ? (
            <>
              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="p-4 border-b border-border">
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <motion.div
                        key={user._id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="flex items-center gap-2 bg-primary/20 rounded-full px-3 py-1"
                      >
                        <span className="text-sm text-primary">{user.name}</span>
                        <button
                          onClick={() => toggleUser(user)}
                          className="text-primary hover:text-primary-dark"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

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
              <ScrollArea className="h-[300px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {users.map((user) => {
                      const isSelected = selectedUsers.some((u) => u._id === user._id);
                      return (
                        <button
                          key={user._id}
                          onClick={() => toggleUser(user)}
                          className="w-full p-4 flex items-center gap-3 hover:bg-surface-hover transition-colors"
                        >
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={getMediaUrl(user.avatar)} />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {getInitials(user.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-text-primary">{user.name}</p>
                            <p className="text-sm text-text-secondary">{user.about}</p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-primary border-primary'
                                : 'border-text-secondary'
                            }`}
                          >
                            {isSelected && <Check className="h-4 w-4 text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Next Button */}
              <div className="p-4 border-t border-border">
                <Button
                  className="w-full"
                  disabled={selectedUsers.length < 2}
                  onClick={() => setStep('details')}
                >
                  Next ({selectedUsers.length} selected)
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Group Details Form */}
              <div className="p-6 space-y-4">
                <div className="flex justify-center">
                  <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Group Name *</label>
                  <Input
                    placeholder="Enter group name"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-text-secondary">Description (optional)</label>
                  <Input
                    placeholder="Enter group description"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                  />
                </div>

                <div className="text-sm text-text-secondary">
                  {selectedUsers.length} participants selected
                </div>
              </div>

              {/* Create Button */}
              <div className="p-4 border-t border-border flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep('select')}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={isCreating || !groupName.trim()}
                  onClick={handleCreateGroup}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Group'
                  )}
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

