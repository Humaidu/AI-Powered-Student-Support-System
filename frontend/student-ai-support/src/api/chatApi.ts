import { chatService } from '../services/chat/chatService';
import { ChatSession, Message, ApiResponse } from '../types';

export const chatApi = {
  getSessions: async (): Promise<ApiResponse<ChatSession[]>> => {
    try {
      const data = await chatService.getSessions();
      return { success: true, message: 'Sessions retrieved successfully', data };
    } catch (e: any) {
      return { success: false, error: { code: 'CHAT_SESSIONS_ERROR', message: e.message } };
    }
  },

  createSession: async (title?: string, category?: string): Promise<ApiResponse<ChatSession>> => {
    try {
      const data = await chatService.createSession(title, category);
      return { success: true, message: 'Session created successfully', data };
    } catch (e: any) {
      return { success: false, error: { code: 'CHAT_CREATE_ERROR', message: e.message } };
    }
  },

  getMessages: async (sessionId: string): Promise<ApiResponse<Message[]>> => {
    try {
      const data = await chatService.getMessages(sessionId);
      return { success: true, message: 'Messages loaded successfully', data };
    } catch (e: any) {
      return { success: false, error: { code: 'MESSAGES_FETCH_ERROR', message: e.message } };
    }
  },

  sendMessage: async (sessionId: string, content: string): Promise<ApiResponse<Message>> => {
    try {
      const data = await chatService.sendMessage(sessionId, content);
      return { success: true, message: 'Message sent successfully', data };
    } catch (e: any) {
      return { success: false, error: { code: 'MESSAGE_SEND_ERROR', message: e.message } };
    }
  },

  deleteSession: async (sessionId: string): Promise<ApiResponse<null>> => {
    try {
      await chatService.deleteSession(sessionId);
      return { success: true, message: 'Session deleted', data: null };
    } catch (e: any) {
      return { success: false, error: { code: 'DELETE_SESSION_ERROR', message: e.message } };
    }
  },

  pinSession: async (sessionId: string, isPinned: boolean): Promise<ApiResponse<ChatSession>> => {
    try {
      const data = await chatService.pinSession(sessionId, isPinned);
      return { success: true, message: 'Session pin status updated', data };
    } catch (e: any) {
      return { success: false, error: { code: 'PIN_SESSION_ERROR', message: e.message } };
    }
  }
};
