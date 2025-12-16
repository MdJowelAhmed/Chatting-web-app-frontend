'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Forward, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chatStore';
import { messagesApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { getInitials, getConversationName, getConversationAvatar, getMediaUrl } from '@/lib/utils';
import type { Message, Conversation } from '@/types';

interface ForwardMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    message: Message | null;
    currentUserId: string;
}

export function ForwardMessageModal({ isOpen, onClose, message, currentUserId }: ForwardMessageModalProps) {
    const { conversations, addMessage } = useChatStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConversations, setSelectedConversations] = useState<string[]>([]);
    const [isForwarding, setIsForwarding] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (!isOpen) {
            setSearchQuery('');
            setSelectedConversations([]);
        }
    }, [isOpen]);

    // Filter conversations based on search
    const filteredConversations = conversations.filter((conv) => {
        const name = getConversationName(conv, currentUserId);
        return name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const toggleConversation = (convId: string) => {
        setSelectedConversations((prev) =>
            prev.includes(convId)
                ? prev.filter((id) => id !== convId)
                : [...prev, convId]
        );
    };

    const handleForward = async () => {
        if (!message || selectedConversations.length === 0) return;

        setIsForwarding(true);
        try {
            // Forward message to each selected conversation
            for (const convId of selectedConversations) {
                const content = message.type === 'text'
                    ? message.content
                    : message.file?.originalName || 'Forwarded media';

                const response = await messagesApi.sendMessage(convId, content);

                if (response.success && response.data) {
                    addMessage(convId, response.data);
                }
            }

            toast({
                title: 'Forwarded!',
                description: `Message sent to ${selectedConversations.length} conversation${selectedConversations.length > 1 ? 's' : ''}`,
            });
            onClose();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to forward message',
                variant: 'destructive',
            });
        } finally {
            setIsForwarding(false);
        }
    };

    if (!isOpen) return null;

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
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-surface rounded-xl shadow-modal w-full max-w-md overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-border">
                        <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <Forward className="h-5 w-5 text-primary" />
                            Forward Message
                        </h2>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="p-3 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-background rounded-lg pl-10 pr-4 py-2 text-sm text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    {/* Message preview */}
                    {message && (
                        <div className="px-4 py-2 bg-background/50 border-b border-border">
                            <p className="text-xs text-text-secondary mb-1">Forwarding:</p>
                            <p className="text-sm text-text-primary truncate">
                                {message.type === 'text'
                                    ? message.content
                                    : `📎 ${message.type}: ${message.file?.originalName || ''}`}
                            </p>
                        </div>
                    )}

                    {/* Conversation list */}
                    <div className="max-h-[300px] overflow-y-auto">
                        {filteredConversations.length === 0 ? (
                            <div className="p-8 text-center text-text-secondary">
                                No conversations found
                            </div>
                        ) : (
                            filteredConversations.map((conv) => {
                                const name = getConversationName(conv, currentUserId);
                                const avatar = getConversationAvatar(conv, currentUserId);
                                const isSelected = selectedConversations.includes(conv._id);

                                return (
                                    <button
                                        key={conv._id}
                                        onClick={() => toggleConversation(conv._id)}
                                        className={`w-full flex items-center gap-3 p-3 hover:bg-surface-hover transition-colors ${isSelected ? 'bg-primary/10' : ''
                                            }`}
                                    >
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={getMediaUrl(avatar)} />
                                            <AvatarFallback className="bg-primary/20 text-primary">
                                                {getInitials(name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-medium text-text-primary">{name}</p>
                                            <p className="text-xs text-text-secondary">
                                                {conv.type === 'group' ? `${conv.participants.length} members` : 'Private chat'}
                                            </p>
                                        </div>
                                        <div
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                                    ? 'bg-primary border-primary'
                                                    : 'border-text-secondary'
                                                }`}
                                        >
                                            {isSelected && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t border-border">
                        <Button
                            onClick={handleForward}
                            disabled={selectedConversations.length === 0 || isForwarding}
                            className="w-full bg-primary hover:bg-primary-dark text-white"
                        >
                            {isForwarding ? (
                                'Forwarding...'
                            ) : (
                                <>
                                    <Forward className="h-4 w-4 mr-2" />
                                    Forward to {selectedConversations.length || ''} {selectedConversations.length === 1 ? 'chat' : selectedConversations.length > 1 ? 'chats' : 'selected'}
                                </>
                            )}
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
