'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, PhoneOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useCallStore } from '@/store/callStore';
import { socketService } from '@/lib/socket';
import { callsApi } from '@/lib/api';
import { getInitials, getMediaUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function IncomingCallModal() {
  const { incomingCall, setIncomingCall, setActiveCall, startCall } = useCallStore();
  const { toast } = useToast();
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);

  // Play ringtone when incoming call
  useEffect(() => {
    if (incomingCall) {
      // Create and play ringtone
      ringtoneRef.current = new Audio('/ringtone.mp3');
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(() => {
        // Auto-play might be blocked, that's okay
      });
    }

    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current = null;
      }
    };
  }, [incomingCall]);

  const handleAccept = async () => {
    if (!incomingCall) return;

    // Stop ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current = null;
    }

    try {
      console.log('📞 Accepting call:', incomingCall.call._id);
      
      // Accept the call via API
      const response = await callsApi.acceptCall(incomingCall.call._id);
      
      if (response.success && response.data) {
        // Set the active call with updated data
        setActiveCall(response.data);
        
        // Start the call with the signal from incoming call
        startCall(response.data.type);
        
        // Clear incoming call modal
        setIncomingCall(null);
        
        console.log('✅ Call accepted successfully');
      } else {
        throw new Error('Failed to accept call');
      }
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept the call',
        variant: 'destructive',
      });
      setIncomingCall(null);
    }
  };

  const handleReject = async () => {
    if (!incomingCall) return;

    // Stop ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current = null;
    }

    try {
      console.log('❌ Rejecting call:', incomingCall.call._id);
      
      // Reject the call via API
      await callsApi.rejectCall(incomingCall.call._id);
      
      // Notify the caller via socket
      socketService.rejectCall({
        to: incomingCall.caller._id,
        callId: incomingCall.call._id,
      });
      
      console.log('✅ Call rejected successfully');
    } catch (error) {
      console.error('❌ Error rejecting call:', error);
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
        className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-gradient-to-br from-[#0f2744] to-[#1a3a5c] rounded-3xl p-8 text-center max-w-sm w-full mx-4 shadow-2xl border border-white/10"
        >
          {/* Caller Avatar with pulse animation */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="relative inline-block"
          >
            {/* Pulse rings */}
            <motion.div
              animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-primary/30"
            />
            <motion.div
              animate={{ scale: [1, 1.3], opacity: [0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              className="absolute inset-0 rounded-full bg-primary/20"
            />
            
            <Avatar className="h-28 w-28 ring-4 ring-primary/40 relative z-10">
              <AvatarImage src={getMediaUrl(caller.avatar)} />
              <AvatarFallback className="text-3xl bg-primary/20 text-primary">
                {getInitials(caller.name)}
              </AvatarFallback>
            </Avatar>
            
            {/* Call type indicator */}
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary rounded-full p-2.5 shadow-lg"
            >
              {isVideoCall ? (
                <Video className="h-5 w-5 text-white" />
              ) : (
                <Phone className="h-5 w-5 text-white" />
              )}
            </motion.div>
          </motion.div>

          {/* Caller Info */}
          <h2 className="text-2xl font-semibold text-white mt-8">
            {caller.name}
          </h2>
          <p className="text-white/60 mt-2">
            Incoming {isVideoCall ? 'video' : 'audio'} call
          </p>

          {/* Ringing Animation */}
          <div className="flex justify-center gap-1.5 mt-5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                className="w-2.5 h-2.5 bg-primary rounded-full"
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-10 mt-10">
            {/* Reject */}
            <div className="text-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleReject}
                className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 transition-colors"
              >
                <PhoneOff className="h-7 w-7 text-white" />
              </motion.button>
              <p className="text-white/60 text-sm mt-2">Decline</p>
            </div>

            {/* Accept */}
            <div className="text-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAccept}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 transition-colors"
              >
                {isVideoCall ? (
                  <Video className="h-7 w-7 text-white" />
                ) : (
                  <Phone className="h-7 w-7 text-white" />
                )}
              </motion.button>
              <p className="text-white/60 text-sm mt-2">Accept</p>
            </div>
          </div>

          {/* Quick decline message */}
          <Button
            variant="ghost"
            className="mt-6 text-white/50 hover:text-white/70 hover:bg-white/10"
            onClick={handleReject}
          >
            Send message instead
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
