'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  Users,
  MessageSquare,
  MoreVertical,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useCallStore } from '@/store/callStore';
import { socketService } from '@/lib/socket';
import { callsApi } from '@/lib/api';
import { formatCallDuration, getInitials, getMediaUrl } from '@/lib/utils';

export function VideoCallScreen() {
  const {
    activeCall,
    callType,
    isCallActive,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    callDuration,
    localStream,
    remoteStreams,
    participants,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    setLocalStream,
    endCall,
    incrementDuration,
  } = useCallStore();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Start duration timer
  useEffect(() => {
    if (isCallActive && activeCall?.status === 'ongoing') {
      const interval = setInterval(incrementDuration, 1000);
      return () => clearInterval(interval);
    }
  }, [isCallActive, activeCall?.status, incrementDuration]);

  // Setup local media stream
  useEffect(() => {
    const setupMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: callType === 'video',
          audio: true,
        });
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    if (isCallActive) {
      setupMedia();
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isCallActive, callType]);

  // Update local video when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleEndCall = async () => {
    if (activeCall) {
      try {
        await callsApi.endCall(activeCall._id);
        // Notify other participants
        activeCall.participants.forEach((p) => {
          socketService.endCall({
            to: typeof p.user === 'string' ? p.user : p.user._id,
            callId: activeCall._id,
          });
        });
      } catch (error) {
        console.error('Error ending call:', error);
      }
    }
    endCall();
  };

  const handleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });
        // Replace video track with screen share
        // In production, you'd handle this with WebRTC properly
        toggleScreenShare();
        socketService.startScreenShare({ roomId: activeCall?.roomId });
      } catch (error) {
        console.error('Screen share error:', error);
      }
    } else {
      toggleScreenShare();
      socketService.stopScreenShare({ roomId: activeCall?.roomId });
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!isCallActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 flex flex-col"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-3">
          <div className="text-white">
            <h2 className="font-semibold">
              {activeCall?.isGroupCall ? 'Group Call' : 'Call'}
            </h2>
            <p className="text-sm text-white/70">
              {activeCall?.status === 'ongoing'
                ? formatCallDuration(callDuration)
                : 'Connecting...'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <Minimize2 className="h-5 w-5" />
            ) : (
              <Maximize2 className="h-5 w-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 bg-background-chat relative">
        {callType === 'video' ? (
          <>
            {/* Remote videos */}
            {remoteStreams.size > 0 ? (
              <div className={`h-full grid gap-2 p-2 ${
                remoteStreams.size === 1 ? 'grid-cols-1' :
                remoteStreams.size <= 4 ? 'grid-cols-2' :
                'grid-cols-3'
              }`}>
                {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
                  <div key={peerId} className="relative bg-surface rounded-lg overflow-hidden">
                    <video
                      autoPlay
                      playsInline
                      ref={(el) => {
                        if (el) el.srcObject = stream;
                      }}
                      className="w-full h-full object-cover"
                    />
                    {participants.get(peerId) && (
                      <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
                        {participants.get(peerId)?.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // No remote streams yet - show caller info
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Avatar className="h-32 w-32 mx-auto mb-4">
                    <AvatarImage src={getMediaUrl(activeCall?.caller?.avatar || '')} />
                    <AvatarFallback className="text-4xl bg-primary/20 text-primary">
                      {getInitials(activeCall?.caller?.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="text-2xl font-semibold text-text-primary">
                    {activeCall?.caller?.name}
                  </h2>
                  <p className="text-text-secondary mt-2">
                    {activeCall?.status === 'ringing' ? 'Ringing...' : 'Connecting...'}
                  </p>
                </div>
              </div>
            )}

            {/* Local video (picture-in-picture) */}
            <motion.div
              drag
              dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
              className="absolute bottom-24 right-4 w-40 h-56 bg-surface rounded-lg overflow-hidden shadow-lg"
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
              />
              {!isVideoEnabled && (
                <div className="w-full h-full flex items-center justify-center bg-surface">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      You
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              {isMuted && (
                <div className="absolute top-2 right-2 bg-danger rounded-full p-1">
                  <MicOff className="h-3 w-3 text-white" />
                </div>
              )}
            </motion.div>
          </>
        ) : (
          // Audio call UI
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Avatar className="h-40 w-40 mx-auto mb-6">
                  <AvatarImage src={getMediaUrl(activeCall?.caller?.avatar || '')} />
                  <AvatarFallback className="text-5xl bg-primary/20 text-primary">
                    {getInitials(activeCall?.caller?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <h2 className="text-3xl font-semibold text-text-primary">
                {activeCall?.caller?.name}
              </h2>
              <p className="text-xl text-text-secondary mt-2">
                {activeCall?.status === 'ongoing'
                  ? formatCallDuration(callDuration)
                  : activeCall?.status === 'ringing'
                  ? 'Ringing...'
                  : 'Connecting...'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex items-center justify-center gap-4">
          {/* Mute */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              isMuted ? 'bg-danger' : 'bg-surface-hover'
            }`}
          >
            {isMuted ? (
              <MicOff className="h-6 w-6 text-white" />
            ) : (
              <Mic className="h-6 w-6 text-white" />
            )}
          </motion.button>

          {/* Video toggle */}
          {callType === 'video' && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleVideo}
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                !isVideoEnabled ? 'bg-danger' : 'bg-surface-hover'
              }`}
            >
              {isVideoEnabled ? (
                <Video className="h-6 w-6 text-white" />
              ) : (
                <VideoOff className="h-6 w-6 text-white" />
              )}
            </motion.button>
          )}

          {/* Screen share */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleScreenShare}
            className={`w-14 h-14 rounded-full flex items-center justify-center ${
              isScreenSharing ? 'bg-primary' : 'bg-surface-hover'
            }`}
          >
            <Monitor className="h-6 w-6 text-white" />
          </motion.button>

          {/* End call */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEndCall}
            className="w-14 h-14 bg-danger rounded-full flex items-center justify-center"
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </motion.button>

          {/* Participants */}
          {activeCall?.isGroupCall && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-14 h-14 bg-surface-hover rounded-full flex items-center justify-center"
            >
              <Users className="h-6 w-6 text-white" />
            </motion.button>
          )}

          {/* Chat */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-14 h-14 bg-surface-hover rounded-full flex items-center justify-center"
          >
            <MessageSquare className="h-6 w-6 text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

