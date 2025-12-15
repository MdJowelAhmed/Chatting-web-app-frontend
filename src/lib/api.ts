import axios from 'axios';
import type {
  ApiResponse,
  User,
  Conversation,
  Message,
  Call,
  LoginCredentials,
  RegisterData,
  AuthResponse,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ AUTH API ============
export const authApi = {
  register: async (data: RegisterData): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  updatePassword: async (currentPassword: string, newPassword: string): Promise<ApiResponse<{ token: string }>> => {
    const response = await api.put('/auth/password', { currentPassword, newPassword });
    return response.data;
  },
};

// ============ USERS API ============
export const usersApi = {
  getUsers: async (search?: string, page = 1, limit = 20): Promise<ApiResponse<User[]>> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    const response = await api.get(`/users?${params}`);
    return response.data;
  },

  getUserById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  updateAvatar: async (file: File): Promise<ApiResponse<User>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.put('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  addContact: async (userId: string): Promise<ApiResponse<User[]>> => {
    const response = await api.post(`/users/contacts/${userId}`);
    return response.data;
  },

  removeContact: async (userId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/users/contacts/${userId}`);
    return response.data;
  },

  blockUser: async (userId: string): Promise<ApiResponse<null>> => {
    const response = await api.post(`/users/block/${userId}`);
    return response.data;
  },

  unblockUser: async (userId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/users/block/${userId}`);
    return response.data;
  },

  getBlockedUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get('/users/blocked');
    return response.data;
  },
};

// ============ CONVERSATIONS API ============
export const conversationsApi = {
  getConversations: async (): Promise<ApiResponse<Conversation[]>> => {
    const response = await api.get('/conversations');
    return response.data;
  },

  getConversationById: async (id: string): Promise<ApiResponse<Conversation>> => {
    const response = await api.get(`/conversations/${id}`);
    return response.data;
  },

  getOrCreatePrivate: async (userId: string): Promise<ApiResponse<Conversation>> => {
    const response = await api.post(`/conversations/private/${userId}`);
    return response.data;
  },

  createGroup: async (name: string, participants: string[], description?: string): Promise<ApiResponse<Conversation>> => {
    const response = await api.post('/conversations/group', { name, participants, description });
    return response.data;
  },

  updateGroup: async (id: string, data: { name?: string; description?: string }): Promise<ApiResponse<Conversation>> => {
    const response = await api.put(`/conversations/group/${id}`, data);
    return response.data;
  },

  addParticipants: async (id: string, participants: string[]): Promise<ApiResponse<Conversation>> => {
    const response = await api.post(`/conversations/group/${id}/participants`, { participants });
    return response.data;
  },

  removeParticipant: async (conversationId: string, userId: string): Promise<ApiResponse<Conversation>> => {
    const response = await api.delete(`/conversations/group/${conversationId}/participants/${userId}`);
    return response.data;
  },

  leaveGroup: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.post(`/conversations/group/${id}/leave`);
    return response.data;
  },

  makeAdmin: async (conversationId: string, userId: string): Promise<ApiResponse<null>> => {
    const response = await api.post(`/conversations/group/${conversationId}/admin/${userId}`);
    return response.data;
  },

  deleteConversation: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/conversations/${id}`);
    return response.data;
  },
};

// ============ MESSAGES API ============
export const messagesApi = {
  getMessages: async (conversationId: string, page = 1, limit = 50): Promise<ApiResponse<Message[]>> => {
    const response = await api.get(`/messages/${conversationId}?page=${page}&limit=${limit}`);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string, replyTo?: string): Promise<ApiResponse<Message>> => {
    const response = await api.post(`/messages/${conversationId}`, { content, replyTo });
    return response.data;
  },

  sendFile: async (conversationId: string, file: File, replyTo?: string): Promise<ApiResponse<Message>> => {
    const formData = new FormData();
    formData.append('file', file);
    if (replyTo) formData.append('replyTo', replyTo);
    const response = await api.post(`/messages/${conversationId}/file`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  sendVoice: async (conversationId: string, audioBlob: Blob, duration: number): Promise<ApiResponse<Message>> => {
    const formData = new FormData();
    formData.append('voice', audioBlob, 'voice.webm');
    formData.append('duration', duration.toString());
    const response = await api.post(`/messages/${conversationId}/voice`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  markAsRead: async (conversationId: string): Promise<ApiResponse<null>> => {
    const response = await api.put(`/messages/${conversationId}/read`);
    return response.data;
  },

  deleteForMe: async (messageId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },

  deleteForEveryone: async (messageId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/messages/${messageId}/everyone`);
    return response.data;
  },

  reactToMessage: async (messageId: string, emoji: string): Promise<ApiResponse<{ reactions: any[] }>> => {
    const response = await api.post(`/messages/${messageId}/react`, { emoji });
    return response.data;
  },

  starMessage: async (messageId: string): Promise<ApiResponse<{ isStarred: boolean }>> => {
    const response = await api.post(`/messages/${messageId}/star`);
    return response.data;
  },

  getStarredMessages: async (): Promise<ApiResponse<Message[]>> => {
    const response = await api.get('/messages/starred');
    return response.data;
  },
};

// ============ CALLS API ============
export const callsApi = {
  initiateCall: async (receiverId: string, type: 'audio' | 'video', isGroupCall = false, conversationId?: string): Promise<ApiResponse<Call>> => {
    const response = await api.post('/calls/initiate', { receiverId, type, isGroupCall, conversationId });
    return response.data;
  },

  acceptCall: async (callId: string): Promise<ApiResponse<Call>> => {
    const response = await api.post(`/calls/${callId}/accept`);
    return response.data;
  },

  rejectCall: async (callId: string): Promise<ApiResponse<null>> => {
    const response = await api.post(`/calls/${callId}/reject`);
    return response.data;
  },

  endCall: async (callId: string): Promise<ApiResponse<Call>> => {
    const response = await api.post(`/calls/${callId}/end`);
    return response.data;
  },

  getCallHistory: async (page = 1, limit = 20): Promise<ApiResponse<Call[]>> => {
    const response = await api.get(`/calls/history?page=${page}&limit=${limit}`);
    return response.data;
  },

  getActiveCall: async (): Promise<ApiResponse<Call | null>> => {
    const response = await api.get('/calls/active');
    return response.data;
  },
};

export default api;

