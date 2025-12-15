'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatSidebar } from './ChatSidebar';
import { ChatWindow } from './ChatWindow';
import { useChatStore } from '@/store/chatStore';
import { MessageCircle } from 'lucide-react';

export function ChatLayout() {
  const { activeConversation } = useChatStore();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Sidebar */}
      <div
        className={`
          ${activeConversation ? 'hidden md:flex' : 'flex'}
          w-full md:w-[400px] lg:w-[420px] flex-shrink-0 border-r border-border
        `}
      >
        <ChatSidebar onSelectConversation={() => setIsMobileSidebarOpen(false)} />
      </div>

      {/* Chat Window */}
      <div className={`flex-1 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
        <AnimatePresence mode="wait">
          {activeConversation ? (
            <motion.div
              key={activeConversation._id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <ChatWindow onBack={() => setIsMobileSidebarOpen(true)} />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center bg-background-chat chat-bg-pattern"
            >
              <div className="text-center p-8">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold text-text-primary mb-2">
                  WhatsApp Clone
                </h2>
                <p className="text-text-secondary max-w-sm">
                  Send and receive messages without keeping your phone online.
                  Use WhatsApp on up to 4 linked devices and 1 phone at the same time.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

