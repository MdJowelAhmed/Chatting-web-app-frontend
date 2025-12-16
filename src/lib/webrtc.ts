'use client';

import { socketService } from './socket';

// ICE servers configuration for STUN/TURN
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 10,
};

export type CallType = 'audio' | 'video';

interface WebRTCCallbacks {
  onLocalStream: (stream: MediaStream) => void;
  onRemoteStream: (stream: MediaStream, peerId: string) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
  onIceConnectionStateChange: (state: RTCIceConnectionState) => void;
  onCallEnded: () => void;
  onError: (error: Error) => void;
}

// Check if WebRTC is supported and we're in a secure context
function checkWebRTCSupport(): { supported: boolean; error?: string } {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return { supported: false, error: 'Not in browser environment' };
  }

  // Check for secure context (HTTPS or localhost)
  if (!window.isSecureContext) {
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      return { 
        supported: false, 
        error: 'WebRTC requires HTTPS. Please access via localhost:3004 or use HTTPS.' 
      };
    }
  }

  // Check for mediaDevices API
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return { 
      supported: false, 
      error: 'Your browser does not support WebRTC. Please use a modern browser like Chrome, Firefox, or Edge.' 
    };
  }

  // Check for RTCPeerConnection
  if (!window.RTCPeerConnection) {
    return { 
      supported: false, 
      error: 'WebRTC is not fully supported in your browser.' 
    };
  }

  return { supported: true };
}

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private callbacks: Partial<WebRTCCallbacks> = {};
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private isInitiator: boolean = false;
  private remoteUserId: string = '';
  private callId: string = '';
  private callType: CallType = 'audio';
  private isScreenSharing: boolean = false;
  private originalVideoTrack: MediaStreamTrack | null = null;

  setCallbacks(callbacks: Partial<WebRTCCallbacks>) {
    this.callbacks = callbacks;
  }

  async initializeMedia(type: CallType): Promise<MediaStream> {
    // Check WebRTC support first
    const support = checkWebRTCSupport();
    if (!support.supported) {
      const error = new Error(support.error || 'WebRTC not supported');
      console.error('❌ WebRTC not supported:', support.error);
      this.callbacks.onError?.(error);
      throw error;
    }

    try {
      // Stop any existing streams first
      this.stopLocalStream();

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === 'video' ? {
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user',
        } : false,
      };

      console.log('📹 Requesting media with constraints:', constraints);
      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Got local stream:', this.localStream.getTracks().map(t => `${t.kind}: ${t.label}`));
      
      this.callType = type;
      this.callbacks.onLocalStream?.(this.localStream);
      
      return this.localStream;
    } catch (error: any) {
      console.error('❌ Error accessing media devices:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Failed to access camera/microphone';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Camera/microphone permission denied. Please allow access in your browser settings.';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'No camera or microphone found. Please connect a device and try again.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera/microphone is already in use by another application.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera does not support the requested video quality.';
      } else if (error.name === 'TypeError') {
        errorMessage = 'WebRTC requires HTTPS. Please access via localhost:3004';
      }
      
      const customError = new Error(errorMessage);
      this.callbacks.onError?.(customError);
      throw customError;
    }
  }

  async createPeerConnection(): Promise<RTCPeerConnection> {
    if (this.peerConnection) {
      console.log('♻️ Closing existing peer connection');
      this.peerConnection.close();
    }

    console.log('🔗 Creating new RTCPeerConnection');
    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        console.log(`➕ Adding ${track.kind} track to peer connection`);
        this.peerConnection!.addTrack(track, this.localStream!);
      });
    }

    // Handle incoming tracks
    this.peerConnection.ontrack = (event) => {
      console.log('📥 Received remote track:', event.track.kind);
      
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
      }
      
      event.streams[0].getTracks().forEach(track => {
        console.log(`➕ Adding remote ${track.kind} track`);
        this.remoteStream!.addTrack(track);
      });
      
      this.callbacks.onRemoteStream?.(this.remoteStream, this.remoteUserId);
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Sending ICE candidate');
        socketService.sendIceCandidate({
          candidate: event.candidate.toJSON(),
          to: this.remoteUserId,
        });
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('🔄 Connection state:', state);
      this.callbacks.onConnectionStateChange?.(state as RTCPeerConnectionState);
      
      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        console.log('📴 Connection ended with state:', state);
      }
    };

    // Handle ICE connection state changes
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log('🧊 ICE connection state:', state);
      this.callbacks.onIceConnectionStateChange?.(state as RTCIceConnectionState);
    };

    // Handle ICE gathering state changes
    this.peerConnection.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering state:', this.peerConnection?.iceGatheringState);
    };

    // Process any pending ICE candidates
    if (this.pendingIceCandidates.length > 0) {
      console.log(`📦 Processing ${this.pendingIceCandidates.length} pending ICE candidates`);
      for (const candidate of this.pendingIceCandidates) {
        await this.addIceCandidate(candidate);
      }
      this.pendingIceCandidates = [];
    }

    return this.peerConnection;
  }

  async initiateCall(remoteUserId: string, callId: string, type: CallType): Promise<void> {
    console.log(`📞 Initiating ${type} call to ${remoteUserId}`);
    
    this.isInitiator = true;
    this.remoteUserId = remoteUserId;
    this.callId = callId;
    this.callType = type;

    try {
      // Initialize media first
      await this.initializeMedia(type);
      
      // Create peer connection
      await this.createPeerConnection();

      // Create and send offer
      const offer = await this.peerConnection!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video',
      });

      console.log('📤 Created offer:', offer.type);
      await this.peerConnection!.setLocalDescription(offer);

      // Send call signal to remote user
      socketService.callUser({
        userToCall: remoteUserId,
        signalData: offer,
        callType: type,
        callId: callId,
      });

      console.log('📤 Sent call signal to:', remoteUserId);
    } catch (error) {
      console.error('❌ Error initiating call:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  async acceptCall(
    remoteUserId: string,
    callId: string,
    type: CallType,
    offer: RTCSessionDescriptionInit
  ): Promise<void> {
    console.log(`📞 Accepting ${type} call from ${remoteUserId}`);
    
    this.isInitiator = false;
    this.remoteUserId = remoteUserId;
    this.callId = callId;
    this.callType = type;

    try {
      // Initialize media first
      await this.initializeMedia(type);
      
      // Create peer connection
      await this.createPeerConnection();

      // Set remote description (the offer)
      console.log('📥 Setting remote description (offer)');
      await this.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));

      // Create and send answer
      const answer = await this.peerConnection!.createAnswer();
      console.log('📤 Created answer:', answer.type);
      
      await this.peerConnection!.setLocalDescription(answer);

      // Send answer back to caller
      socketService.answerCall({
        signal: answer,
        to: remoteUserId,
        callId: callId,
      });

      console.log('📤 Sent answer to:', remoteUserId);
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  async handleAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    console.log('📥 Handling answer');
    
    if (!this.peerConnection) {
      console.error('❌ No peer connection exists');
      return;
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Set remote description (answer)');
    } catch (error) {
      console.error('❌ Error handling answer:', error);
      this.callbacks.onError?.(error as Error);
    }
  }

  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
      console.log('📦 Queuing ICE candidate (no remote description yet)');
      this.pendingIceCandidates.push(candidate);
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('✅ Added ICE candidate');
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  }

  async startScreenShare(): Promise<MediaStream | null> {
    // Check WebRTC support first
    const support = checkWebRTCSupport();
    if (!support.supported) {
      console.error('❌ Screen share not supported:', support.error);
      this.callbacks.onError?.(new Error(support.error || 'Screen share not supported'));
      return null;
    }

    try {
      console.log('🖥️ Starting screen share');
      
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
        } as any,
        audio: false, // Screen audio often causes issues
      });

      const videoTrack = this.screenStream.getVideoTracks()[0];
      
      // Store original video track
      if (this.localStream) {
        this.originalVideoTrack = this.localStream.getVideoTracks()[0] || null;
      }

      // Handle when user stops sharing via browser UI
      videoTrack.onended = () => {
        console.log('🖥️ Screen share ended by user');
        this.stopScreenShare();
      };

      // Replace video track in peer connection
      if (this.peerConnection && this.localStream) {
        const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
          console.log('✅ Replaced video track with screen share');
        }
      }

      this.isScreenSharing = true;
      return this.screenStream;
    } catch (error) {
      console.error('❌ Error starting screen share:', error);
      this.callbacks.onError?.(error as Error);
      return null;
    }
  }

  async stopScreenShare(): Promise<void> {
    console.log('🖥️ Stopping screen share');
    
    try {
      // Stop screen stream tracks
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(track => track.stop());
        this.screenStream = null;
      }

      // Restore original video track
      if (this.peerConnection && this.originalVideoTrack) {
        const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(this.originalVideoTrack);
          console.log('✅ Restored original video track');
        }
      } else if (this.peerConnection && this.callType === 'video') {
        // Re-acquire camera if original track is gone
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
          const newVideoTrack = newStream.getVideoTracks()[0];
          
          const sender = this.peerConnection.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(newVideoTrack);
            console.log('✅ Acquired new video track');
          }
          
          // Update local stream
          if (this.localStream) {
            const oldVideoTrack = this.localStream.getVideoTracks()[0];
            if (oldVideoTrack) {
              this.localStream.removeTrack(oldVideoTrack);
            }
            this.localStream.addTrack(newVideoTrack);
            this.callbacks.onLocalStream?.(this.localStream);
          }
        } catch (error) {
          console.error('❌ Error re-acquiring camera:', error);
        }
      }

      this.isScreenSharing = false;
      this.originalVideoTrack = null;
    } catch (error) {
      console.error('❌ Error stopping screen share:', error);
    }
  }

  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        console.log(`🎤 Mic ${audioTrack.enabled ? 'unmuted' : 'muted'}`);
        return !audioTrack.enabled; // Return isMuted state
      }
    }
    return false;
  }

  toggleVideo(): boolean {
    if (this.localStream && !this.isScreenSharing) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        console.log(`📹 Video ${videoTrack.enabled ? 'enabled' : 'disabled'}`);
        return videoTrack.enabled;
      }
    }
    return true;
  }

  getIsScreenSharing(): boolean {
    return this.isScreenSharing;
  }

  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`⏹️ Stopped ${track.kind} track`);
      });
      this.localStream = null;
    }
  }

  endCall(): void {
    console.log('📴 Ending call');
    
    // Stop screen share if active
    if (this.isScreenSharing) {
      this.stopScreenShare();
    }
    
    // Stop local stream
    this.stopLocalStream();
    
    // Stop remote stream
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    // Reset state
    this.pendingIceCandidates = [];
    this.isInitiator = false;
    this.remoteUserId = '';
    this.callId = '';
    this.originalVideoTrack = null;
    this.isScreenSharing = false;
    
    this.callbacks.onCallEnded?.();
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  getCallId(): string {
    return this.callId;
  }

  getRemoteUserId(): string {
    return this.remoteUserId;
  }
}

// Export singleton instance
export const webRTCService = new WebRTCService();
export default webRTCService;

