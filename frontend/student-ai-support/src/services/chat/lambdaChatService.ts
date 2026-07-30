import { ChatServiceProvider } from './chatServiceProvider';
import { ChatSession, Message } from '../../types';
import { config } from '../../config/environment';

export class LambdaChatService implements ChatServiceProvider {
  async getSessions(): Promise<ChatSession[]> {
    const res = await fetch(`${config.API_BASE_URL}/chat/sessions`);
    const json = await res.json();
    return json.data;
  }

  async createSession(title?: string, category?: string): Promise<ChatSession> {
    const res = await fetch(`${config.API_BASE_URL}/chat/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category })
    });
    const json = await res.json();
    return json.data;
  }

  async getMessages(sessionId: string): Promise<Message[]> {
    const res = await fetch(`${config.API_BASE_URL}/chat/sessions/${sessionId}/messages`);
    const json = await res.json();
    return json.data;
  }

  async sendMessage(sessionId: string, content: string): Promise<Message> {
    const res = await fetch(`${config.API_BASE_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, content })
    });
    const json = await res.json();
    return json.data;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await fetch(`${config.API_BASE_URL}/chat/sessions/${sessionId}`, { method: 'DELETE' });
  }

  async pinSession(sessionId: string, isPinned: boolean): Promise<ChatSession> {
    const res = await fetch(`${config.API_BASE_URL}/chat/sessions/${sessionId}/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPinned })
    });
    const json = await res.json();
    return json.data;
  }
}
