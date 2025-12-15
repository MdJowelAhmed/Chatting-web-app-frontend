'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smile,
  Paperclip,
  Mic,
  Send,
  X,
  Image as ImageIcon,
  FileText,
  Camera,
  Square,
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chatStore';
import { messagesApi } from '@/lib/api';
import { socketService } from '@/lib/socket';
import { toast } from '@/hooks/use-toast';

interface MessageInputProps {
  conversationId: string;
}

export function MessageInput({ conversationId }: MessageInputProps) {
  const { replyingTo, setReplyingTo, addMessage } = useChatStore();
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSending, setIsSending] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleTyping = () => {
    socketService.startTyping(conversationId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(conversationId);
    }, 2000);
  };

  const handleSend = async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await messagesApi.sendMessage(
        conversationId,
        message.trim(),
        replyingTo?._id
      );

      if (response.success && response.data) {
        addMessage(conversationId, response.data);
        setMessage('');
        setReplyingTo(null);
        socketService.stopTyping(conversationId);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSending(true);
    setShowAttach(false);

    try {
      const response = await messagesApi.sendFile(conversationId, file, replyingTo?._id);
      if (response.success && response.data) {
        addMessage(conversationId, response.data);
        setReplyingTo(null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send file',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop());

        setIsSending(true);
        try {
          const response = await messagesApi.sendVoice(conversationId, audioBlob, recordingTime);
          if (response.success && response.data) {
            addMessage(conversationId, response.data);
          }
        } catch (error) {
          toast({
            title: 'Error',
            description: 'Failed to send voice message',
            variant: 'destructive',
          });
        } finally {
          setIsSending(false);
          setRecordingTime(0);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Microphone access denied',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingTime(0);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="border-t border-border bg-surface">
      {/* Reply preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 py-2 border-b border-border flex items-center justify-between"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-primary font-medium">
                {typeof replyingTo.sender === 'object'
                  ? replyingTo.sender.name
                  : 'Unknown'}
              </p>
              <p className="text-sm text-text-secondary truncate">
                {replyingTo.content || 'Media'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setReplyingTo(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording UI */}
      {isRecording ? (
        <div className="p-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-danger"
            onClick={cancelRecording}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="flex-1 flex items-center gap-4">
            <div className="w-3 h-3 bg-danger rounded-full animate-pulse" />
            <span className="text-text-primary font-mono">{formatTime(recordingTime)}</span>
            <div className="flex-1 flex gap-0.5">
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 20 + 5}px`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          </div>

          <Button
            size="icon"
            className="bg-primary hover:bg-primary-dark"
            onClick={stopRecording}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div className="p-4 flex items-end gap-2">
          {/* Emoji button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowEmoji(!showEmoji);
                setShowAttach(false);
              }}
            >
              <Smile className="h-5 w-5 text-text-secondary" />
            </Button>

            <AnimatePresence>
              {showEmoji && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 z-10"
                >
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setMessage((prev) => prev + emojiData.emoji);
                      inputRef.current?.focus();
                    }}
                    width={320}
                    height={400}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Attach button */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setShowAttach(!showAttach);
                setShowEmoji(false);
              }}
            >
              <Paperclip className="h-5 w-5 text-text-secondary" />
            </Button>

            <AnimatePresence>
              {showAttach && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 bg-surface border border-border rounded-lg shadow-modal p-2 z-10"
                >
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        (fileInputRef.current as any).accept = 'image/*';
                      }}
                      className="w-14 h-14 flex flex-col items-center justify-center bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30"
                    >
                      <ImageIcon className="h-6 w-6" />
                      <span className="text-[10px] mt-1">Photo</span>
                    </button>
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        (fileInputRef.current as any).accept = '*/*';
                      }}
                      className="w-14 h-14 flex flex-col items-center justify-center bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30"
                    >
                      <FileText className="h-6 w-6" />
                      <span className="text-[10px] mt-1">Document</span>
                    </button>
                    <button
                      onClick={() => {
                        fileInputRef.current?.click();
                        (fileInputRef.current as any).accept = 'video/*';
                      }}
                      className="w-14 h-14 flex flex-col items-center justify-center bg-pink-500/20 text-pink-400 rounded-lg hover:bg-pink-500/30"
                    >
                      <Camera className="h-6 w-6" />
                      <span className="text-[10px] mt-1">Video</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Text input */}
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message"
              rows={1}
              className="w-full bg-background-light rounded-lg px-4 py-3 text-text-primary placeholder-text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 max-h-32"
              style={{ minHeight: '48px' }}
            />
          </div>

          {/* Send / Voice button */}
          {message.trim() ? (
            <Button
              size="icon"
              className="bg-primary hover:bg-primary-dark"
              onClick={handleSend}
              disabled={isSending}
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={startRecording}
              className="text-text-secondary hover:text-text-primary"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

