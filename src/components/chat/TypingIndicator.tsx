'use client';

import { motion } from 'framer-motion';

interface TypingIndicatorProps {
  users: { id: string; name: string }[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex justify-start mb-1"
    >
      <div className="bg-incoming px-4 py-3 rounded-lg rounded-tl-none max-w-[100px]">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 bg-text-secondary rounded-full typing-dot" />
          <span className="w-2 h-2 bg-text-secondary rounded-full typing-dot" />
          <span className="w-2 h-2 bg-text-secondary rounded-full typing-dot" />
        </div>
      </div>
    </motion.div>
  );
}

