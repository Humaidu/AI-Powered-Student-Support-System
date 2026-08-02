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
  },

  register: async (name: string, email: string, password: string, role?: UserRole): Promise<ApiResponse<{ needsConfirmation: boolean }>> => {
    try {
      const data = await authService.register(name, email, password, role);
      return { success: true, message: 'Registration successful', data };
    } catch (e: any) {
      return { success: false, error: { code: 'REGISTER_FAILED', message: e.message } };
    }
  },

  confirmRegistration: async (email: string, code: string): Promise<ApiResponse<null>> => {
    try {
      await authService.confirmRegistration(email, code);
      return { success: true, message: 'Account confirmed', data: null };
    } catch (e: any) {
      return { success: false, error: { code: 'CONFIRM_FAILED', message: e.message } };
    }
  },

  forgotPassword: async (email: string): Promise<ApiResponse<null>> => {
    try {
      await authService.forgotPassword(email);
      return { success: true, message: 'Reset code sent', data: null };
    } catch (e: any) {
      return { success: false, error: { code: 'FORGOT_PASSWORD_FAILED', message: e.message } };
    }
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<ApiResponse<null>> => {
    try {
      await authService.resetPassword(email, code, newPassword);
      return { success: true, message: 'Password reset successful', data: null };
    } catch (e: any) {
      return { success: false, error: { code: 'RESET_PASSWORD_FAILED', message: e.message } };
    }
  },
};
