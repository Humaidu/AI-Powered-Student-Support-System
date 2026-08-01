export type AppMode = 'mock' | 'aws';

export const config = {
  APP_MODE: (import.meta.env.VITE_APP_MODE as AppMode) || 'mock',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  IS_MOCK: ((import.meta.env.VITE_APP_MODE as AppMode) || 'mock') === 'mock',
  COGNITO_USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
  COGNITO_APP_CLIENT_ID: import.meta.env.VITE_COGNITO_APP_CLIENT_ID || '',
};
