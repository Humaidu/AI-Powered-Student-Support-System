import { MockChatService } from './mockChatService';
import { LambdaChatService } from './lambdaChatService';
import { ChatServiceProvider } from './chatServiceProvider';
import { ChatSession, Message } from '../../types';
import { config } from '../../config/environment';

class ChatService {
  private provider: ChatServiceProvider;

  constructor() {
    if (config.APP_MODE === 'aws') {
      this.provider = new LambdaChatService();
    } else {
      this.provider = new MockChatService();
    }
  }

  public async getSessions(): Promise<ChatSession[]> {
    return this.provider.getSessions();
  }

  public async createSession(title?: string, category?: string): Promise<ChatSession> {
    return this.provider.createSession(title, category);
  }

  public async getMessages(sessionId: string): Promise<Message[]> {
    return this.provider.getMessages(sessionId);
  }

  public async sendMessage(sessionId: string, content: string): Promise<Message> {
    return this.provider.sendMessage(sessionId, content);
  }

  public async deleteSession(sessionId: string): Promise<void> {
    return this.provider.deleteSession(sessionId);
  }

  public async pinSession(sessionId: string, isPinned: boolean): Promise<ChatSession> {
    return this.provider.pinSession(sessionId, isPinned);
  }
}

export const chatService = new ChatService();
