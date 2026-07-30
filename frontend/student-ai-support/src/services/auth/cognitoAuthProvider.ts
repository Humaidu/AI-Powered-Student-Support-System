import { AuthProvider } from './authProvider';
import { User, UserRole } from '../../types';
import { config } from '../../config/environment';

export class CognitoAuthProvider implements AuthProvider {
  async login(email: string, password?: string): Promise<User> {
    const res = await fetch(`${config.API_BASE_URL}/auth/cognito/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Cognito authentication failed');
    return json.data;
  }

  async logout(): Promise<void> {
    await fetch(`${config.API_BASE_URL}/auth/cognito/logout`, { method: 'POST' });
  }

  async getCurrentUser(): Promise<User | null> {
    const res = await fetch(`${config.API_BASE_URL}/auth/me`);
    const json = await res.json();
    return json.success ? json.data : null;
  }

  async switchRole(role: UserRole): Promise<User> {
    const res = await fetch(`${config.API_BASE_URL}/auth/switch-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
    const json = await res.json();
    return json.data;
  }
}
