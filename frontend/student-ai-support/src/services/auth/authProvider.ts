import { User, UserRole } from '../../types';

export interface AuthProvider {
  login(email: string, password?: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  switchRole(role: UserRole): Promise<User>;
  register(name: string, email: string, password: string, role?: UserRole): Promise<{ needsConfirmation: boolean }>;
  confirmRegistration(email: string, code: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(email: string, code: string, newPassword: string): Promise<void>;
}
