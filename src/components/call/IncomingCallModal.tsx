'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, PhoneOff, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useCallStore } from '@/store/callStore';
import { socketService } from '@/lib/socket';
import { callsApi } from '@/lib/api';
import { getInitials, getMediaUrl } from '@/lib/utils';

export function IncomingCallModal() {
  const { incomingCall, setIncomingCall, setActiveCall, startCall } = useCallStore();

  const handleAccept = async () => {
    if (!incomingCall) return;

    try {
      const response = await callsApi.acceptCall(incomingCall.call._id);
      if (response.success && response.data) {
        setActiveCall(response.data);
        startCall(response.data.type);
        setIncomingCall(null);
      }
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const handleReject = async () => {
    if (!incomingCall) return;

    try {
      await callsApi.rejectCall(incomingCall.call._id);
      socketService.rejectCall({
        to: incomingCall.caller._id,
        callId: incomingCall.call._id,
      });
    } catch (error) {
      console.error('Error rejecting call:', error);
    } finally {
      setIncomingCall(null);
    }
  };

  if (!incomingCall) return null;

  const { caller, call } = incomingCall;
  const isVideoCall = call.type === 'video';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-background-light rounded-2xl p-8 text-center max-w-sm w-full mx-4"
        >
          {/* Caller Avatar */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="relative inline-block"
          >
            <Avatar className="h-24 w-24 ring-pulse">
              <AvatarImage src={getMediaUrl(caller.avatar)} />
              <AvatarFallback className="text-2xl bg-primary/20 text-primary">
                {getInitials(caller.name)}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary rounded-full p-2">
              {isVideoCall ? (
                <Video className="h-4 w-4 text-white" />
              ) : (
                <Phone className="h-4 w-4 text-white" />
              )}
            </div>
          </motion.div>

          {/* Caller Info */}
          <h2 className="text-xl font-semibold text-text-primary mt-6">
            {caller.name}
          </h2>
          <p className="text-text-secondary mt-1">
            Incoming {isVideoCall ? 'video' : 'audio'} call...
          </p>

          {/* Ringing Animation */}
          <div className="flex justify-center gap-2 mt-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="w-2 h-2 bg-primary rounded-full"
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-8 mt-8">
            {/* Reject */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleReject}
              className="w-16 h-16 bg-danger rounded-full flex items-center justify-center shadow-lg"
            >
              <PhoneOff className="h-7 w-7 text-white" />
            </motion.button>

            {/* Accept */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAccept}
              className="w-16 h-16 bg-success rounded-full flex items-center justify-center shadow-lg"
            >
              {isVideoCall ? (
                <Video className="h-7 w-7 text-white" />
              ) : (
                <Phone className="h-7 w-7 text-white" />
              )}
            </motion.button>
          </div>

          {/* Decline with message */}
          <Button
            variant="ghost"
            className="mt-6 text-text-secondary"
            onClick={handleReject}
          >
            Decline
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

