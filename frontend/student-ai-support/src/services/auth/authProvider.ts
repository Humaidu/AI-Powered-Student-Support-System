import { User, UserRole } from '../../types';

export interface AuthProvider {
  login(email: string, password?: string): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  switchRole(role: UserRole): Promise<User>;
}
