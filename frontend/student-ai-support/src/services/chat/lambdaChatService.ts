import { ChatServiceProvider } from './chatServiceProvider';
import { ChatSession, Message } from '../../types';
import { apiClient } from '../../api/client';

type BackendChatSession = {
  sessionId: string;
  createdAt: string;
};

type BackendSource = {
  documentId?: string;
  documentTitle?: string;  // Backend will add this
  chunkId?: string;
  pageNumber?: number;
};

type BackendMessage = {
  messageId: string;
  sessionId?: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  sources?: BackendSource[];
};

function mapSession(session: BackendChatSession): ChatSession {
  const createdAt =
    typeof session.createdAt === 'string'
      ? session.createdAt
      : String(session.createdAt ?? '');

  return {
    id: session.sessionId,
    title: `Conversation ${session.sessionId.slice(0, 8)}`,
    category: 'General',
    lastMessage: '',
    updatedAt: createdAt,
    messageCount: 0,
    model: 'Bedrock + RAG',
  };
}

function mapMessage(message: BackendMessage, fallbackSessionId: string): Message {
  const mappedSources = (message.sources || []).map((source) => ({
    document: source.documentTitle || source.documentId || 'Institutional Document',
    documentId: source.documentId,
    page: source.pageNumber || '-',
    section: source.chunkId ? `Chunk ${source.chunkId}` : 'Referenced section',
    confidence: 0.9,
  }));

  return {
    id: message.messageId,
    sessionId: message.sessionId || fallbackSessionId,
    sender: message.role === 'user' ? 'student' : 'assistant',
    content: message.content,
    timestamp: message.createdAt,
    ragVerification:
      message.role === 'assistant' && mappedSources.length > 0
        ? {
            sourceCount: mappedSources.length,
            sources: mappedSources,
          }
        : undefined,
  };
}

export class LambdaChatService implements ChatServiceProvider {
  async getSessions(): Promise<ChatSession[]> {
    const res = await apiClient<{ sessions?: BackendChatSession[] } | BackendChatSession[]>('/chat/sessions');
    if (!res.success) throw new Error(res.error?.message || 'Failed to load sessions');
    const sessions = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.sessions)
        ? res.data.sessions
        : [];
    return sessions.map(mapSession);
  }

  async createSession(title?: string, category?: string): Promise<ChatSession> {
    // Backend doesn't accept title/category in request body (creates empty session)
    // Keep signature for frontend compatibility but send empty body
    const res = await apiClient<BackendChatSession>('/chat/sessions', {
      method: 'POST',
      body: JSON.stringify({})
    });
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to create session');
    return mapSession(res.data);
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    const res = await apiClient<{ messages?: BackendMessage[] } | BackendMessage[]>(`/chat/sessions/${sessionId}/messages`);
    if (!res.success) throw new Error(res.error?.message || 'Failed to load messages');
    const messages = Array.isArray(res.data)
      ? res.data
      : Array.isArray(res.data?.messages)
        ? res.data.messages
        : [];
    return messages.map((message) => mapMessage(message, sessionId));
  }

  async sendMessage(sessionId: string, content: string): Promise<Message> {
    const res = await apiClient<{
      messageId: string;
      sessionId: string;
      answer: string;
      createdAt: string;
      sources?: BackendSource[];
    }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ sessionId, message: content })
    });
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to send message');
    return mapMessage(
      {
        messageId: res.data.messageId,
        sessionId: res.data.sessionId,
        role: 'assistant',
        content: res.data.answer,
        createdAt: res.data.createdAt,
        sources: res.data.sources,
      },
      sessionId,
    );
  }

  async deleteSession(sessionId: string): Promise<void> {
    const res = await apiClient<null>(`/chat/sessions/${sessionId}`, { method: 'DELETE' });
    if (!res.success) throw new Error(res.error?.message || 'Failed to delete session');
  }

  async pinSession(sessionId: string, isPinned: boolean): Promise<ChatSession> {
    const res = await apiClient<ChatSession>(`/chat/sessions/${sessionId}/pin`, {
      method: 'POST',
      body: JSON.stringify({ isPinned })
    });
    if (!res.success || !res.data) throw new Error(res.error?.message || 'Failed to pin session');
    return res.data;
  }
}
