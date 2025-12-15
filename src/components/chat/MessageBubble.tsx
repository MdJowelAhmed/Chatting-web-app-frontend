'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Check,
  CheckCheck,
  Clock,
  Download,
  Play,
  Pause,
  Reply,
  Forward,
  Trash2,
  Star,
  Copy,
  MoreVertical,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatMessageTime, formatFileSize, getFileIcon, getInitials, getMediaUrl } from '@/lib/utils';
import { useChatStore } from '@/store/chatStore';
import type { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSender?: boolean;
}

export function MessageBubble({ message, isOwn, showSender = false }: MessageBubbleProps) {
  const { setReplyingTo } = useChatStore();
  const [showMenu, setShowMenu] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const sender = typeof message.sender === 'object' ? message.sender : null;

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sent':
        return <Check className="h-3 w-3 text-text-secondary" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-text-secondary" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-accent-blue" />;
      default:
        return <Clock className="h-3 w-3 text-text-secondary" />;
    }
  };

  if (message.isDeletedForEveryone) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}
      >
        <div
          className={`max-w-[70%] px-3 py-2 rounded-lg ${
            isOwn ? 'bg-outgoing' : 'bg-incoming'
          }`}
        >
          <p className="text-sm text-text-secondary italic">
            🚫 This message was deleted
          </p>
        </div>
      </motion.div>
    );
  }

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="space-y-1">
            <img
              src={getMediaUrl(message.file?.url || '')}
              alt="Shared image"
              className="max-w-[300px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(getMediaUrl(message.file?.url || ''), '_blank')}
            />
            {message.content && (
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {message.content}
              </p>
            )}
          </div>
        );

      case 'video':
        return (
          <div className="space-y-1">
            <video
              src={getMediaUrl(message.file?.url || '')}
              controls
              className="max-w-[300px] rounded-lg"
            />
            {message.content && (
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {message.content}
              </p>
            )}
          </div>
        );

      case 'audio':
      case 'voice':
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-white" />
              ) : (
                <Play className="h-5 w-5 text-white ml-0.5" />
              )}
            </button>
            <div className="flex-1">
              <div className="flex gap-0.5">
                {Array.from({ length: 30 }).map((_, i) => (
                  <div
                    key={i}
                    className="waveform-bar"
                    style={{ animationDelay: `${i * 0.05}s`, height: `${Math.random() * 12 + 4}px` }}
                  />
                ))}
              </div>
              <span className="text-xs text-text-secondary">
                {message.file?.duration ? `${Math.floor(message.file.duration / 60)}:${(message.file.duration % 60).toString().padStart(2, '0')}` : '0:00'}
              </span>
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="flex items-center gap-3 p-2 bg-background/30 rounded-lg min-w-[200px]">
            <span className="text-2xl">{getFileIcon(message.file?.mimeType || '')}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary truncate">
                {message.file?.originalName || 'Document'}
              </p>
              <p className="text-xs text-text-secondary">
                {formatFileSize(message.file?.size || 0)}
              </p>
            </div>
            <a
              href={getMediaUrl(message.file?.url || '')}
              download={message.file?.originalName}
              className="p-2 hover:bg-background/50 rounded-full"
            >
              <Download className="h-4 w-4 text-text-secondary" />
            </a>
          </div>
        );

      default:
        return (
          <p className="text-sm text-text-primary whitespace-pre-wrap break-words">
            {message.content}
          </p>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 group`}
    >
      {/* Other user avatar */}
      {!isOwn && showSender && sender && (
        <Avatar className="h-8 w-8 mr-2 mt-auto">
          <AvatarImage src={getMediaUrl(sender.avatar)} />
          <AvatarFallback className="text-xs bg-primary/20 text-primary">
            {getInitials(sender.name)}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="relative max-w-[70%]">
        {/* Reply preview */}
        {message.replyTo && (
          <div
            className={`mb-1 p-2 rounded-lg text-xs ${
              isOwn ? 'bg-outgoing/80' : 'bg-incoming/80'
            } border-l-2 border-primary`}
          >
            <p className="text-primary font-medium">
              {typeof message.replyTo.sender === 'object'
                ? message.replyTo.sender.name
                : 'Unknown'}
            </p>
            <p className="text-text-secondary truncate">{message.replyTo.content}</p>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`relative px-3 py-2 rounded-lg ${
            isOwn
              ? 'bg-outgoing rounded-tr-none'
              : 'bg-incoming rounded-tl-none'
          }`}
        >
          {/* Sender name for groups */}
          {!isOwn && showSender && sender && (
            <p className="text-xs text-primary font-medium mb-1">{sender.name}</p>
          )}

          {/* Message content */}
          {renderContent()}

          {/* Time and status */}
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className="text-[10px] text-text-secondary">
              {formatMessageTime(message.createdAt)}
            </span>
            {isOwn && getStatusIcon()}
          </div>

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="absolute -bottom-3 left-2 flex bg-surface rounded-full px-1 py-0.5 shadow">
              {message.reactions.slice(0, 3).map((reaction, i) => (
                <span key={i} className="text-xs">
                  {reaction.emoji}
                </span>
              ))}
              {message.reactions.length > 3 && (
                <span className="text-xs text-text-secondary ml-1">
                  +{message.reactions.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Context menu button */}
        <div
          className={`absolute top-0 ${
            isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
          } opacity-0 group-hover:opacity-100 transition-opacity px-1`}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical className="h-4 w-4 text-text-secondary" />
          </Button>

          {/* Context menu */}
          {showMenu && (
            <div
              className={`absolute ${
                isOwn ? 'right-0' : 'left-0'
              } mt-1 w-40 bg-surface border border-border rounded-lg shadow-modal z-10`}
            >
              <button
                className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-hover flex items-center gap-2"
                onClick={() => {
                  setReplyingTo(message);
                  setShowMenu(false);
                }}
              >
                <Reply className="h-4 w-4" />
                Reply
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-hover flex items-center gap-2"
                onClick={() => {
                  navigator.clipboard.writeText(message.content);
                  setShowMenu(false);
                }}
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-hover flex items-center gap-2"
                onClick={() => setShowMenu(false)}
              >
                <Forward className="h-4 w-4" />
                Forward
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-hover flex items-center gap-2"
                onClick={() => setShowMenu(false)}
              >
                <Star className="h-4 w-4" />
                Star
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm text-danger hover:bg-surface-hover flex items-center gap-2"
                onClick={() => setShowMenu(false)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

