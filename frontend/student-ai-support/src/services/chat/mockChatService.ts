import { ChatServiceProvider } from './chatServiceProvider';
import { ChatSession, Message } from '../../types';
import initialSessions from '../../mock/conversations.json';
import initialMessagesMap from '../../mock/messages.json';
import { vectorSearchService } from '../vector/vectorSearchService';
import { aiService } from '../ai/aiService';

const SESSIONS_STORAGE_KEY = 'hypervisor_chat_sessions';
const MESSAGES_STORAGE_KEY = 'hypervisor_chat_messages';

export class MockChatService implements ChatServiceProvider {
  private getStoredSessions(): ChatSession[] {
    const stored = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(initialSessions));
    return initialSessions as ChatSession[];
  }

  private saveSessions(sessions: ChatSession[]): void {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  }

  private getStoredMessagesMap(): Record<string, Message[]> {
    const stored = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* ignore */ }
    }
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(initialMessagesMap));
    return initialMessagesMap as Record<string, Message[]>;
  }

  private saveMessagesMap(messagesMap: Record<string, Message[]>): void {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messagesMap));
  }

  async getSessions(): Promise<ChatSession[]> {
    await new Promise(res => setTimeout(res, 250));
    return this.getStoredSessions();
  }

  async createSession(title?: string, category?: string): Promise<ChatSession> {
    await new Promise(res => setTimeout(res, 200));
    const sessions = this.getStoredSessions();
    const newSession: ChatSession = {
      id: `chat-${Date.now()}`,
      title: title || 'New Academic Inquiry',
      category: (category as any) || 'Academic',
      lastMessage: 'Session created. Ask your question...',
      updatedAt: 'Just now',
      messageCount: 0,
      isPinned: false,
      isArchived: false,
      model: 'GPT-4o + RAG Model (Bedrock Simulated)'
    };

    sessions.unshift(newSession);
    this.saveSessions(sessions);

    const messagesMap = this.getStoredMessagesMap();
    messagesMap[newSession.id] = [];
    this.saveMessagesMap(messagesMap);

    return newSession;
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    await new Promise(res => setTimeout(res, 200));
    const messagesMap = this.getStoredMessagesMap();
    return messagesMap[sessionId] || [];
  }

  async sendMessage(sessionId: string, content: string): Promise<Message> {
    const messagesMap = this.getStoredMessagesMap();
    const currentMessages = messagesMap[sessionId] || [];

    // 1. Save student message
    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sessionId,
      sender: 'student',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    currentMessages.push(userMsg);
    messagesMap[sessionId] = currentMessages;
    this.saveMessagesMap(messagesMap);

    // 2. Perform RAG Vector Similarity Search (OpenSearch Simulation)
    const searchResults = await vectorSearchService.search(content, 3);
    const contextChunks = searchResults.map(r => r.chunk);

    // 3. Generate AI Answer using aiService (Bedrock / Gemini simulation)
    const aiResponse = await aiService.generateAnswer(content, contextChunks);

    // 4. Formulate Assistant Message
    const assistantMsg: Message = {
      id: `msg-${Date.now()}-assistant`,
      sessionId,
      sender: 'assistant',
      content: aiResponse.answer,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ragVerification: {
        sourceCount: aiResponse.sources.length,
        sources: aiResponse.sources
      },
      suggestedFollowups: aiResponse.suggestedFollowups
    };

    currentMessages.push(assistantMsg);
    messagesMap[sessionId] = currentMessages;
    this.saveMessagesMap(messagesMap);

    // Update Session Metadata
    const sessions = this.getStoredSessions();
    const sessionIdx = sessions.findIndex(s => s.id === sessionId);
    if (sessionIdx !== -1) {
      sessions[sessionIdx].lastMessage = content;
      sessions[sessionIdx].updatedAt = 'Just now';
      sessions[sessionIdx].messageCount = currentMessages.length;
      if (sessions[sessionIdx].title === 'New Academic Inquiry' || sessions[sessionIdx].title === 'New Conversation') {
        sessions[sessionIdx].title = content.length > 35 ? content.slice(0, 35) + '...' : content;
      }
      this.saveSessions(sessions);
    }

    return assistantMsg;
  }

  async deleteSession(sessionId: string): Promise<void> {
    const sessions = this.getStoredSessions().filter(s => s.id !== sessionId);
    this.saveSessions(sessions);
    const messagesMap = this.getStoredMessagesMap();
    delete messagesMap[sessionId];
    this.saveMessagesMap(messagesMap);
  }

  async pinSession(sessionId: string, isPinned: boolean): Promise<ChatSession> {
    const sessions = this.getStoredSessions();
    const target = sessions.find(s => s.id === sessionId);
    if (target) {
      target.isPinned = isPinned;
      this.saveSessions(sessions);
      return target;
    }
    throw new Error('Session not found');
  }
}
