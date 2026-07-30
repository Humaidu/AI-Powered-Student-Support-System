import { ApiResponse } from '../types';
import { config } from '../config/environment';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${config.API_BASE_URL}${endpoint}`;
  
  // Attach JWT token from auth storage
  const storedUser = localStorage.getItem('hypervisor_current_user');
  let token = 'mock.jwt.token';
  if (storedUser) {
    try { token = JSON.parse(storedUser).token; } catch { /* ignore */ }
  }

  const defaultHeaders: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string>),
      },
    });

    const data: ApiResponse<T> = await response.json();
    return data;
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
