import { create } from 'zustand';
import type { Call, CallType, User } from '@/types';

interface IncomingCallData {
  call: Call;
  caller: { _id: string; name: string; avatar: string };
  signal?: RTCSessionDescriptionInit;
}

interface CallState {
  // Call state
  activeCall: Call | null;
  incomingCall: IncomingCallData | null;
  callType: CallType | null;
  isCallActive: boolean;
  isRinging: boolean;
  
  // Media state
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  
  // Connection state
  connectionState: RTCPeerConnectionState | null;
  iceConnectionState: RTCIceConnectionState | null;
  
  // Call info
  callDuration: number;
  callSignal: RTCSessionDescriptionInit | null;
  participants: Map<string, { name: string; avatar: string; isMuted: boolean; isVideoEnabled: boolean }>;

  // Actions
  setActiveCall: (call: Call | null) => void;
  setIncomingCall: (data: IncomingCallData | null) => void;
  startCall: (type: CallType) => void;
  endCall: () => void;
  
  // Media controls
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  setMuted: (muted: boolean) => void;
  setVideoEnabled: (enabled: boolean) => void;
  setScreenSharing: (sharing: boolean) => void;
  
  // Stream management
  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (peerId: string, stream: MediaStream) => void;
  removeRemoteStream: (peerId: string) => void;
  
  // Connection state
  setConnectionState: (state: RTCPeerConnectionState) => void;
  setIceConnectionState: (state: RTCIceConnectionState) => void;
  
  // Participants
  updateParticipant: (peerId: string, data: { name: string; avatar: string; isMuted?: boolean; isVideoEnabled?: boolean }) => void;
  removeParticipant: (peerId: string) => void;
  
  // Timer
  incrementDuration: () => void;
  resetCallState: () => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  activeCall: null,
  incomingCall: null,
  callType: null,
  isCallActive: false,
  isRinging: false,
  isMuted: false,
  isVideoEnabled: true,
  isScreenSharing: false,
  callDuration: 0,
  callSignal: null,
  localStream: null,
  remoteStreams: new Map(),
  participants: new Map(),
  connectionState: null,
  iceConnectionState: null,

  setActiveCall: (call) => {
    set({ activeCall: call, isCallActive: !!call });
  },

  setIncomingCall: (data) => {
    set({ 
      incomingCall: data, 
      isRinging: !!data,
      callSignal: data?.signal || null,
    });
  },

  startCall: (type) => {
    const incomingCall = get().incomingCall;
    set({
      callType: type,
      isCallActive: true,
      isRinging: true,
      isVideoEnabled: type === 'video',
      callDuration: 0,
      callSignal: incomingCall?.signal || null,
      connectionState: null,
      iceConnectionState: null,
    });
  },

  endCall: () => {
    const { localStream, remoteStreams } = get();

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Clear remote streams
    remoteStreams.forEach((stream) => {
      stream.getTracks().forEach((track) => track.stop());
    });

    set({
      activeCall: null,
      incomingCall: null,
      callType: null,
      isCallActive: false,
      isRinging: false,
      isMuted: false,
      isVideoEnabled: true,
      isScreenSharing: false,
      callDuration: 0,
      callSignal: null,
      localStream: null,
      remoteStreams: new Map(),
      participants: new Map(),
      connectionState: null,
      iceConnectionState: null,
    });
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // Toggle: if muted, enable; if not muted, disable
      });
    }
    set({ isMuted: !isMuted });
  },

  toggleVideo: () => {
    const { localStream, isVideoEnabled, isScreenSharing } = get();
    if (localStream && !isScreenSharing) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
    }
    set({ isVideoEnabled: !isVideoEnabled });
  },

  toggleScreenShare: () => {
    set((state) => ({ isScreenSharing: !state.isScreenSharing }));
  },

  setMuted: (muted) => {
    const { localStream } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
    set({ isMuted: muted });
  },

  setVideoEnabled: (enabled) => {
    const { localStream, isScreenSharing } = get();
    if (localStream && !isScreenSharing) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }
    set({ isVideoEnabled: enabled });
  },

  setScreenSharing: (sharing) => {
    set({ isScreenSharing: sharing });
  },

  setLocalStream: (stream) => {
    set({ localStream: stream });
  },

  addRemoteStream: (peerId, stream) => {
    const remoteStreams = new Map(get().remoteStreams);
    remoteStreams.set(peerId, stream);
    set({ remoteStreams });
  },

  removeRemoteStream: (peerId) => {
    const remoteStreams = new Map(get().remoteStreams);
    const stream = remoteStreams.get(peerId);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    remoteStreams.delete(peerId);
    set({ remoteStreams });
  },

  setConnectionState: (state) => {
    set({ connectionState: state });
  },

  setIceConnectionState: (state) => {
    set({ iceConnectionState: state });
  },

  updateParticipant: (peerId, data) => {
    const participants = new Map(get().participants);
    const existing = participants.get(peerId);
    participants.set(peerId, {
      name: data.name,
      avatar: data.avatar,
      isMuted: data.isMuted ?? existing?.isMuted ?? false,
      isVideoEnabled: data.isVideoEnabled ?? existing?.isVideoEnabled ?? true,
    });
    set({ participants });
  },

  removeParticipant: (peerId) => {
    const participants = new Map(get().participants);
    participants.delete(peerId);
    set({ participants });
    get().removeRemoteStream(peerId);
  },

  incrementDuration: () => {
    set((state) => ({ callDuration: state.callDuration + 1 }));
  },

  resetCallState: () => {
    get().endCall();
  },
}));
