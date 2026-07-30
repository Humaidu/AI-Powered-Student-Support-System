import { authService } from '../services/auth/authService';
import { User, UserRole, ApiResponse } from '../types';

export const authApi = {
  login: async (email: string, password?: string): Promise<ApiResponse<User>> => {
    try {
      const data = await authService.login(email, password);
      return { success: true, message: 'Authenticated successfully', data };
    } catch (e: any) {
      return { success: false, error: { code: 'AUTH_FAILED', message: e.message } };
    }
  },

  logout: async (): Promise<ApiResponse<null>> => {
    try {
      await authService.logout();
      return { success: true, message: 'Logged out', data: null };
    } catch (e: any) {
      return { success: false, error: { code: 'LOGOUT_FAILED', message: e.message } };
    }
  },

  getCurrentUser: async (): Promise<ApiResponse<User | null>> => {
    try {
      const data = await authService.getCurrentUser();
      return { success: true, message: 'Current user retrieved', data };
    } catch (e: any) {
      return { success: false, error: { code: 'GET_USER_FAILED', message: e.message } };
    }
  },

  switchRole: async (role: UserRole): Promise<ApiResponse<User>> => {
    try {
      const data = await authService.switchRole(role);
      return { success: true, message: `Switched active role to ${role}`, data };
    } catch (e: any) {
      return { success: false, error: { code: 'SWITCH_ROLE_FAILED', message: e.message } };
    }
  }
};
