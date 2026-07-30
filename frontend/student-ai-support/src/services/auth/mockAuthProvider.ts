import { AuthProvider } from './authProvider';
import { User, UserRole } from '../../types';
import mockUsers from '../../mock/users.json';

const STORAGE_KEY = 'hypervisor_current_user';

export class MockAuthProvider implements AuthProvider {
  async login(email: string): Promise<User> {
    // Artificial realistic service latency
    await new Promise(res => setTimeout(res, 400));

    const found = (mockUsers as User[]).find(
      u => u.email.toLowerCase() === email.toLowerCase()
    );

    if (found) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
      return found;
    }

    // Dynamic mock user for custom university emails
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
      email,
      role: email.includes('admin') || email.includes('dean') || email.includes('prof') ? 'ADMIN' : 'STUDENT',
      title: email.includes('admin') || email.includes('dean') ? 'Dean of Faculty' : 'Undergraduate',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAs-iaqeN3xdi1x_sPBdaomSQ-ab0TZ707LFzngstYljiEHoV_4261hIdq9ml8z2UrAI8Yu7ouWc0LL9mEFojtNhlx7NUESMcGwGKrXkFb7Y4x8SduAROJzWrP3YKwXo8dYjR-TdwPLJu39IxR0bRkcuyLGrPjl_Iua5oR1wr98oQHfHsS_PENPLb5nX5Rx67qeQgxZmS1NCf9TvoylpwNyYRSm9C9Mze-Y9bVTyCjbso9yvVXU-w6ZAi4P7EcZi64zeOi16zCFwrI',
      department: 'Computer Science & Artificial Intelligence',
      token: `mock.jwt.token.${Date.now()}`
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    return newUser;
  }

  async logout(): Promise<void> {
    await new Promise(res => setTimeout(res, 200));
    localStorage.removeItem(STORAGE_KEY);
  }

  async getCurrentUser(): Promise<User | null> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    // Default to James Wilson for instant rich initial preview
    const defaultUser = (mockUsers as User[])[0];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  }

  async switchRole(role: UserRole): Promise<User> {
    const currentUser = await this.getCurrentUser();
    const targetUser = (mockUsers as User[]).find(u => u.role === role) || {
      ...(currentUser || (mockUsers as User[])[0]),
      role,
      title: role === 'ADMIN' ? 'Dean of Faculty' : 'Undergraduate'
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(targetUser));
    return targetUser;
  }
}
