import { ApiResponse } from '../types';
import { config } from '../config/environment';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${config.API_BASE_URL}${endpoint}`;
  
  // Attach JWT token from auth storage.
  const storedUser = localStorage.getItem('hypervisor_current_user');
  let token: string | null = null;
  if (storedUser) {
    try { token = JSON.parse(storedUser).token; } catch { /* ignore */ }
  }

  if (config.APP_MODE === 'aws' && !token) {
    return {
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message: 'Authentication required. Please sign in again.',
      },
    };
  }

  const defaultHeaders: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
  };
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string>),
      },
    });

    const raw = await response.text();
    let parsed: any = {};
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = { message: raw || response.statusText };
    }

    if (!response.ok) {
      const message =
        parsed?.error?.message ||
        parsed?.message ||
        `${response.status} ${response.statusText}`;
      return {
        success: false,
        error: {
          code: parsed?.error?.code || `HTTP_${response.status}`,
          message,
        },
      };
    }

    if (typeof parsed?.success === 'boolean') {
      return parsed as ApiResponse<T>;
    }

    return {
      success: true,
      data: parsed as T,
    };
  } catch (err: any) {
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: err.message || 'Service request failed. Operating in offline/simulated mode.',
      },
    };
  }
}
