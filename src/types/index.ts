// User types
export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  about: string;
  isOnline: boolean;
  lastSeen: string;
  contacts: User[];
  blockedUsers: string[];
  createdAt: string;
  updatedAt: string;
}

// Message types
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'document' | 'voice' | 'location' | 'contact' | 'sticker';
export type MessageStatus = 'sent' | 'delivered' | 'read';

export interface MessageFile {
  url: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  duration?: number;
  thumbnail?: string;
}

export interface MessageReaction {
  user: string;
  emoji: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User | string;
  type: MessageType;
  content: string;
  file?: MessageFile;
  replyTo?: Message;
  status: MessageStatus;
  readBy: { user: string; readAt: string }[];
  deliveredTo: { user: string; deliveredAt: string }[];
  deletedFor: string[];
  isDeletedForEveryone: boolean;
  isForwarded: boolean;
  starredBy: string[];
  reactions: MessageReaction[];
  createdAt: string;
  updatedAt: string;
}

// Conversation types
export type ConversationType = 'private' | 'group';

export interface Conversation {
  _id: string;
  participants: User[];
  type: ConversationType;
  groupName?: string;
  groupAvatar?: string;
  groupDescription?: string;
  groupAdmin?: User[];
  createdBy?: string;
  lastMessage?: Message;
  unreadCount: number;
  pinnedBy: string[];
  mutedBy: { user: string; until: string }[];
  createdAt: string;
  updatedAt: string;
}

// Call types
export type CallType = 'audio' | 'video';
export type CallStatus = 'ringing' | 'ongoing' | 'ended' | 'missed' | 'rejected';
export type ParticipantStatus = 'pending' | 'accepted' | 'rejected' | 'missed' | 'busy';

export interface CallParticipant {
  user: User;
  joinedAt?: string;
  leftAt?: string;
  status: ParticipantStatus;
}

export interface Call {
  _id: string;
  conversation: string;
  caller: User;
  participants: CallParticipant[];
  type: CallType;
  isGroupCall: boolean;
  status: CallStatus;
  startedAt?: string;
  endedAt?: string;
  duration: number;
  roomId: string;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// Socket event types
export interface TypingEvent {
  conversationId: string;
  userId: string;
  userName: string;
}

export interface MessageReadEvent {
  conversationId: string;
  userId: string;
}

export interface OnlineStatusEvent {
  userId: string;
  lastSeen?: string;
}

export interface IncomingCallEvent {
  call: Call;
  caller: {
    _id: string;
    name: string;
    avatar: string;
  };
}

export interface CallSignalEvent {
  signal: RTCSessionDescriptionInit | RTCIceCandidateInit;
  from: string;
  callerName?: string;
  callerAvatar?: string;
  callType?: CallType;
  callId?: string;
}

