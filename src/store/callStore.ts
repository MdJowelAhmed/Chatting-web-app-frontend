import { create } from 'zustand';
import type { Call, CallType, User } from '@/types';

interface CallState {
  activeCall: Call | null;
  incomingCall: {
    call: Call;
    caller: { _id: string; name: string; avatar: string };
  } | null;
  callType: CallType | null;
  isCallActive: boolean;
  isRinging: boolean;
  isMuted: boolean;
  isVideoEnabled: boolean;
  isScreenSharing: boolean;
  callDuration: number;
  localStream: MediaStream | null;
  remoteStreams: Map<string, MediaStream>;
  participants: Map<string, { name: string; avatar: string; isMuted: boolean; isVideoEnabled: boolean }>;
  
  // Actions
  setActiveCall: (call: Call | null) => void;
  setIncomingCall: (data: { call: Call; caller: { _id: string; name: string; avatar: string } } | null) => void;
  startCall: (type: CallType) => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  addRemoteStream: (peerId: string, stream: MediaStream) => void;
  removeRemoteStream: (peerId: string) => void;
  updateParticipant: (peerId: string, data: { name: string; avatar: string; isMuted?: boolean; isVideoEnabled?: boolean }) => void;
  removeParticipant: (peerId: string) => void;
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
  localStream: null,
  remoteStreams: new Map(),
  participants: new Map(),

  setActiveCall: (call) => {
    set({ activeCall: call, isCallActive: !!call });
  },

  setIncomingCall: (data) => {
    set({ incomingCall: data, isRinging: !!data });
  },

  startCall: (type) => {
    set({
      callType: type,
      isCallActive: true,
      isRinging: true,
      isVideoEnabled: type === 'video',
      callDuration: 0,
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
      localStream: null,
      remoteStreams: new Map(),
      participants: new Map(),
    });
  },

  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
    }
    set({ isMuted: !isMuted });
  },

  toggleVideo: () => {
    const { localStream, isVideoEnabled } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
    }
    set({ isVideoEnabled: !isVideoEnabled });
  },

  toggleScreenShare: () => {
    set((state) => ({ isScreenSharing: !state.isScreenSharing }));
  },

  setLocalStream: (stream) => {
    set({ localStream: stream });
  },

  addRemoteStream: (peerId, stream) => {
    const remoteStreams = get().remoteStreams;
    remoteStreams.set(peerId, stream);
    set({ remoteStreams: new Map(remoteStreams) });
  },

  removeRemoteStream: (peerId) => {
    const remoteStreams = get().remoteStreams;
    const stream = remoteStreams.get(peerId);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    remoteStreams.delete(peerId);
    set({ remoteStreams: new Map(remoteStreams) });
  },

  updateParticipant: (peerId, data) => {
    const participants = get().participants;
    const existing = participants.get(peerId);
    participants.set(peerId, {
      name: data.name,
      avatar: data.avatar,
      isMuted: data.isMuted ?? existing?.isMuted ?? false,
      isVideoEnabled: data.isVideoEnabled ?? existing?.isVideoEnabled ?? true,
    });
    set({ participants: new Map(participants) });
  },

  removeParticipant: (peerId) => {
    const participants = get().participants;
    participants.delete(peerId);
    set({ participants: new Map(participants) });
    
    // Also remove remote stream
    get().removeRemoteStream(peerId);
  },

  incrementDuration: () => {
    set((state) => ({ callDuration: state.callDuration + 1 }));
  },

  resetCallState: () => {
    get().endCall();
  },
}));

