/**
 * Public Chat API for unauthenticated guest users on the public website.
 * 
 * NOTE: This requires backend Lambda functions to support guest/public sessions.
 * The backend needs to:
 * 1. Create public endpoints without Cognito authorizer (e.g., /public/chat/*)
 * 2. Generate anonymous session IDs for guests
 * 3. Store guest sessions with limited retention (e.g., 24 hours)
 * 4. Rate-limit public requests to prevent abuse
 */

import { ApiResponse } from '../types';
import { config } from '../config/environment';

interface PublicChatSession {
  sessionId: string;
  guestId: string;
  createdAt: string;
}

interface PublicMessage {
  messageId: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  sources?: Array<{
    documentTitle?: string;
    documentId?: string;
    pageNumber?: number;
    chunkId?: string;
  }>;
}

/**
 * API client for public endpoints (no authentication required)
 */
async function publicApiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${config.API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string>),
      },
    });

    const raw = await response.text();
    let parsed: any = {};
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = { message: raw || response.statusText };
    }

    if (!response.ok) {
      const message =
        parsed?.error?.message ||
        parsed?.message ||
        `${response.status} ${response.statusText}`;
      return {
        success: false,
        error: {
          code: parsed?.error?.code || `HTTP_${response.status}`,
          message,
        },
      };
    }

    return {
      success: true,
      data: parsed as T,
    };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Network request failed',
      },
    };
  }
}

export const publicChatApi = {
  /**
   * Create a new guest chat session
   * Backend endpoint: POST /public/chat/sessions
   */
  createGuestSession: async (
    category: string = 'General Inquiry'
  ): Promise<ApiResponse<PublicChatSession>> => {
    return publicApiClient<PublicChatSession>('/public/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({ category }),
    });
  },

  /**
   * Send a message in a guest session
   * Backend endpoint: POST /public/chat/sessions/{sessionId}/messages
   */
  sendGuestMessage: async (
    sessionId: string,
    content: string
  ): Promise<ApiResponse<PublicMessage>> => {
    return publicApiClient<PublicMessage>(
      `/public/chat/sessions/${sessionId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      }
    );
  },

  /**
   * Get messages for a guest session
   * Backend endpoint: GET /public/chat/sessions/{sessionId}/messages
   */
  getGuestMessages: async (
    sessionId: string
  ): Promise<ApiResponse<{ messages: PublicMessage[] }>> => {
    return publicApiClient<{ messages: PublicMessage[] }>(
      `/public/chat/sessions/${sessionId}/messages`
    );
  },
};
