'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  Maximize2,
  Minimize2,
  MoreVertical,
  User,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useCallStore } from '@/store/callStore';
import { useAuthStore } from '@/store/authStore';
import { webRTCService } from '@/lib/webrtc';
import { socketService } from '@/lib/socket';
import { callsApi } from '@/lib/api';
import { formatCallDuration, getInitials, getMediaUrl } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function VideoCallScreen() {
  const { user } = useAuthStore();
  const {
    activeCall,
    callType,
    isCallActive,
    isMuted,
    isVideoEnabled,
    isScreenSharing,
    callDuration,
    callSignal,
    localStream,
    remoteStreams,
    connectionState,
    participants,
    setLocalStream,
    addRemoteStream,
    setMuted,
    setVideoEnabled,
    setScreenSharing,
    setConnectionState,
    setIceConnectionState,
    endCall,
    incrementDuration,
  } = useCallStore();
  const { toast } = useToast();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get the other user info from the call
  const getOtherUserInfo = useCallback(() => {
    if (!activeCall || !user) return null;
    
    const isInitiator = activeCall.caller._id === user._id;
    
    if (isInitiator) {
      // Find the first participant who is not me
      const participant = activeCall.participants.find(p => {
        const pId = typeof p.user === 'string' ? p.user : p.user._id;
        return pId !== user._id;
      });
      if (participant) {
        const pUser = participant.user;
        return typeof pUser === 'string' 
          ? { _id: pUser, name: 'User', avatar: '' }
          : { _id: pUser._id, name: pUser.name, avatar: pUser.avatar };
      }
    } else {
      return {
        _id: activeCall.caller._id,
        name: activeCall.caller.name,
        avatar: activeCall.caller.avatar,
      };
    }
    return null;
  }, [activeCall, user]);

  // Setup WebRTC callbacks
  useEffect(() => {
    webRTCService.setCallbacks({
      onLocalStream: (stream) => {
        console.log('📹 Setting local stream');
        setLocalStream(stream);
      },
      onRemoteStream: (stream, peerId) => {
        console.log('📺 Setting remote stream from:', peerId);
        addRemoteStream(peerId, stream);
      },
      onConnectionStateChange: (state) => {
        console.log('🔗 Connection state:', state);
        setConnectionState(state);
      },
      onIceConnectionStateChange: (state) => {
        console.log('🧊 ICE state:', state);
        setIceConnectionState(state);
      },
      onCallEnded: () => {
        console.log('📴 Call ended callback');
      },
      onError: (error) => {
        console.error('❌ WebRTC error:', error);
        
        // Check if it's a secure context issue
        const isSecureContextError = error.message?.includes('HTTPS') || 
                                      error.message?.includes('localhost') ||
                                      error.message?.includes('secure');
        
        toast({
          title: isSecureContextError ? 'Secure Connection Required' : 'Call Error',
          description: error.message || 'An error occurred during the call',
          variant: 'destructive',
        });
        
        // End the call if there's a critical error
        if (isSecureContextError) {
          setTimeout(() => handleEndCall(), 2000);
        }
      },
    });

    return () => {
      webRTCService.setCallbacks({});
    };
  }, [setLocalStream, addRemoteStream, setConnectionState, setIceConnectionState, toast]);

  // Initialize call
  useEffect(() => {
    if (!isCallActive || !activeCall || !user || !callType || isInitialized) return;

    const initializeCall = async () => {
      try {
        const otherUser = getOtherUserInfo();
        if (!otherUser) {
          console.error('No other user found');
          return;
        }

        const isInitiator = activeCall.caller._id === user._id;
        console.log(`📞 Initializing call as ${isInitiator ? 'initiator' : 'receiver'}`);

        if (isInitiator) {
          // We're the caller - initiate the WebRTC connection
          await webRTCService.initiateCall(otherUser._id, activeCall._id, callType);
        } else {
          // We're the receiver - wait for the signal and accept
          if (callSignal) {
            await webRTCService.acceptCall(otherUser._id, activeCall._id, callType, callSignal);
          } else {
            console.log('⏳ Waiting for call signal...');
          }
        }

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing call:', error);
        toast({
          title: 'Call Failed',
          description: 'Failed to initialize the call',
          variant: 'destructive',
        });
      }
    };

    initializeCall();
  }, [isCallActive, activeCall, user, callType, callSignal, isInitialized, getOtherUserInfo, toast]);

  // Handle call accepted (for initiator)
  useEffect(() => {
    const handleCallAccepted = ({ signal, from }: { signal: RTCSessionDescriptionInit; from: string; callId: string }) => {
      console.log('✅ Call accepted, setting answer');
      webRTCService.handleAnswer(signal);
    };

    const cleanup = socketService.onCallAccepted(handleCallAccepted);
    return cleanup;
  }, []);

  // Handle ICE candidates
  useEffect(() => {
    const handleIceCandidate = ({ candidate, from }: { candidate: RTCIceCandidateInit; from: string }) => {
      console.log('🧊 Received ICE candidate from:', from);
      webRTCService.addIceCandidate(candidate);
    };

    const cleanup = socketService.onIceCandidate(handleIceCandidate);
    return cleanup;
  }, []);

  // Handle call ended by remote
  useEffect(() => {
    const handleCallEnded = ({ from, callId }: { from: string; callId: string }) => {
      console.log('📴 Call ended by remote user');
      toast({
        title: 'Call Ended',
        description: 'The other user ended the call',
      });
      handleEndCall();
    };

    const cleanup = socketService.onCallEnded(handleCallEnded);
    return cleanup;
  }, []);

  // Handle call rejected
  useEffect(() => {
    const handleCallRejected = ({ from, callId }: { from: string; callId: string }) => {
      console.log('❌ Call rejected');
      toast({
        title: 'Call Rejected',
        description: 'The user declined your call',
      });
      handleEndCall();
    };

    const cleanup = socketService.onCallRejected(handleCallRejected);
    return cleanup;
  }, []);

  // Handle user unavailable
  useEffect(() => {
    const handleUserUnavailable = ({ userId }: { userId: string }) => {
      console.log('📵 User unavailable:', userId);
      toast({
        title: 'User Unavailable',
        description: 'The user is currently offline',
        variant: 'destructive',
      });
      handleEndCall();
    };

    const cleanup = socketService.onUserUnavailable(handleUserUnavailable);
    return cleanup;
  }, []);

  // Update local video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Update remote video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStreams.size > 0) {
      const firstStream = Array.from(remoteStreams.values())[0];
      remoteVideoRef.current.srcObject = firstStream;
    }
  }, [remoteStreams]);

  // Duration timer
  useEffect(() => {
    if (isCallActive && connectionState === 'connected') {
      durationIntervalRef.current = setInterval(incrementDuration, 1000);
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isCallActive, connectionState, incrementDuration]);

  const handleToggleMute = () => {
    const newMuted = webRTCService.toggleMute();
    setMuted(newMuted);
  };

  const handleToggleVideo = () => {
    if (!isScreenSharing) {
      const newEnabled = webRTCService.toggleVideo();
      setVideoEnabled(newEnabled);
    }
  };

  const handleToggleScreenShare = async () => {
    if (!isScreenSharing) {
      const stream = await webRTCService.startScreenShare();
      if (stream) {
        setScreenSharing(true);
        socketService.startScreenShare({ roomId: activeCall?.roomId });
        toast({
          title: 'Screen Sharing',
          description: 'You are now sharing your screen',
        });
      }
    } else {
      await webRTCService.stopScreenShare();
      setScreenSharing(false);
      socketService.stopScreenShare({ roomId: activeCall?.roomId });
      
      // Re-sync local stream
      const newLocalStream = webRTCService.getLocalStream();
      if (newLocalStream) {
        setLocalStream(newLocalStream);
      }
    }
  };

  const handleEndCall = async () => {
    if (activeCall) {
      try {
        await callsApi.endCall(activeCall._id);

        const otherUser = getOtherUserInfo();
        if (otherUser) {
          socketService.endCall({
            to: otherUser._id,
            callId: activeCall._id,
          });
        }
      } catch (error) {
        console.error('Error ending call via API:', error);
      }
    }

    webRTCService.endCall();
    setIsInitialized(false);
    endCall();
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

  const getStatusText = () => {
    if (connectionState === 'connected') {
      return formatCallDuration(callDuration);
    }
    if (connectionState === 'connecting' || connectionState === 'new') {
      return 'Connecting...';
    }
    if (connectionState === 'failed') {
      return 'Connection failed';
    }
    if (connectionState === 'disconnected') {
      return 'Reconnecting...';
    }
    return 'Ringing...';
  };

  if (!isCallActive) return null;

  const otherUser = getOtherUserInfo();
  const hasRemoteStream = remoteStreams.size > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#0a1929] z-50 flex flex-col"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-3">
          <div className="text-white">
            <h2 className="font-semibold">
              {activeCall?.isGroupCall ? 'Group Call' : 'Call'}
            </h2>
            <p className="text-sm text-white/70">{getStatusText()}</p>
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
      <div className="flex-1 relative">
        {callType === 'video' ? (
          <>
            {/* Remote video (main view) */}
            {hasRemoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              // Waiting for remote stream - show avatar
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#0a1929] to-[#1a2f4a]">
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Avatar className="h-32 w-32 mx-auto mb-4 ring-4 ring-primary/30">
                      <AvatarImage src={getMediaUrl(otherUser?.avatar || '')} />
                      <AvatarFallback className="text-4xl bg-primary/20 text-primary">
                        {getInitials(otherUser?.name || 'U')}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <h2 className="text-2xl font-semibold text-white">
                    {otherUser?.name || 'Unknown'}
                  </h2>
                  <p className="text-white/60 mt-2">{getStatusText()}</p>
                </div>
              </div>
            )}

            {/* Local video (picture-in-picture) */}
            <motion.div
              drag
              dragConstraints={{ left: -300, right: 16, top: 80, bottom: -100 }}
              className="absolute bottom-24 right-4 w-36 h-48 bg-surface rounded-xl overflow-hidden shadow-2xl z-20 border-2 border-white/10"
            >
              {localStream && isVideoEnabled && !isScreenSharing ? (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover mirror"
                  style={{ transform: 'scaleX(-1)' }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#1a2f4a]">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/20 text-primary">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
              {isMuted && (
                <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                  <MicOff className="h-3 w-3 text-white" />
                </div>
              )}
              {isScreenSharing && (
                <div className="absolute top-2 left-2 bg-primary rounded-full p-1">
                  <Monitor className="h-3 w-3 text-white" />
                </div>
              )}
            </motion.div>
          </>
        ) : (
          // Audio call UI
          <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#0a1929] to-[#1a2f4a]">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Avatar className="h-40 w-40 mx-auto mb-6 ring-4 ring-primary/30">
                  <AvatarImage src={getMediaUrl(otherUser?.avatar || '')} />
                  <AvatarFallback className="text-5xl bg-primary/20 text-primary">
                    {getInitials(otherUser?.name || 'U')}
                  </AvatarFallback>
                </Avatar>
              </motion.div>
              <h2 className="text-3xl font-semibold text-white">
                {otherUser?.name || 'Unknown'}
              </h2>
              <p className="text-xl text-white/60 mt-2">{getStatusText()}</p>

              {/* Audio waveform animation when connected */}
              {connectionState === 'connected' && (
                <div className="flex items-center justify-center gap-1 mt-6">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [12, 32, 12] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        delay: i * 0.1,
                      }}
                      className="w-1.5 bg-primary rounded-full"
                    />
                  ))}
                </div>
              )}

              {/* Hidden audio elements for remote stream */}
              {Array.from(remoteStreams.values()).map((stream, idx) => (
                <audio
                  key={idx}
                  autoPlay
                  ref={(el) => {
                    if (el) el.srcObject = stream;
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent z-20">
        <div className="flex items-center justify-center gap-4">
          {/* Mute */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isMuted ? 'bg-red-500' : 'bg-[#1e3a5f] hover:bg-[#2a4a6f]'
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
              onClick={handleToggleVideo}
              disabled={isScreenSharing}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                !isVideoEnabled ? 'bg-red-500' : 'bg-[#1e3a5f] hover:bg-[#2a4a6f]'
              } ${isScreenSharing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isVideoEnabled ? (
                <Video className="h-6 w-6 text-white" />
              ) : (
                <VideoOff className="h-6 w-6 text-white" />
              )}
            </motion.button>
          )}

          {/* Screen share */}
          {callType === 'video' && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleScreenShare}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isScreenSharing ? 'bg-primary' : 'bg-[#1e3a5f] hover:bg-[#2a4a6f]'
              }`}
            >
              {isScreenSharing ? (
                <MonitorOff className="h-6 w-6 text-white" />
              ) : (
                <Monitor className="h-6 w-6 text-white" />
              )}
            </motion.button>
          )}

          {/* End call */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEndCall}
            className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors"
          >
            <PhoneOff className="h-6 w-6 text-white" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
