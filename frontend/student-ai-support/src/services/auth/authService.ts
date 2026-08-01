import { MockAuthProvider } from './mockAuthProvider';
import { CognitoAuthProvider } from './cognitoAuthProvider';
import { AuthProvider } from './authProvider';
import { User, UserRole } from '../../types';
import { config } from '../../config/environment';

class AuthService {
  private provider: AuthProvider;

  constructor() {
    if (config.APP_MODE === 'aws') {
      this.provider = new CognitoAuthProvider();
    } else {
      this.provider = new MockAuthProvider();
    }
  }

  public async login(email: string, password?: string): Promise<User> {
    return this.provider.login(email, password);
  }

  public async logout(): Promise<void> {
    return this.provider.logout();
  }

  public async getCurrentUser(): Promise<User | null> {
    return this.provider.getCurrentUser();
  }

  public async switchRole(role: UserRole): Promise<User> {
    return this.provider.switchRole(role);
  }

  public async register(name: string, email: string, password: string, role?: UserRole): Promise<{ needsConfirmation: boolean }> {
    return this.provider.register(name, email, password, role);
  }

  public async confirmRegistration(email: string, code: string): Promise<void> {
    return this.provider.confirmRegistration(email, code);
  }

  public async forgotPassword(email: string): Promise<void> {
    return this.provider.forgotPassword(email);
  }

  public async resetPassword(email: string, code: string, newPassword: string): Promise<void> {
    return this.provider.resetPassword(email, code, newPassword);
  }
}

export const authService = new AuthService();
