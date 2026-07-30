import { ChatSession, Message } from '../../types';

export interface ChatServiceProvider {
  getSessions(): Promise<ChatSession[]>;
  createSession(title?: string, category?: string): Promise<ChatSession>;
  getMessages(sessionId: string): Promise<Message[]>;
  sendMessage(sessionId: string, content: string): Promise<Message>;
  deleteSession(sessionId: string): Promise<void>;
  pinSession(sessionId: string, isPinned: boolean): Promise<ChatSession>;
}
