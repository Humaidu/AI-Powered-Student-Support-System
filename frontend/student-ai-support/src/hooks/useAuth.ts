import { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../api/authApi';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    authApi.getCurrentUser().then(res => {
      if (mounted && res.success) {
        setUser(res.data);
      }
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const login = async (email: string, password?: string) => {
    setLoading(true);
    const res = await authApi.login(email, password);
    if (res.success && res.data) {
      setUser(res.data);
    }
    setLoading(false);
    return res;
  };

  const logout = async () => {
    setLoading(true);
    await authApi.logout();
    setUser(null);
    setLoading(false);
  };

  const switchRole = async (role: UserRole) => {
    setLoading(true);
    const res = await authApi.switchRole(role);
    if (res.success && res.data) {
      setUser(res.data);
    }
    setLoading(false);
    return res;
  };

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isStudent: user?.role === 'STUDENT',
    isAdmin: user?.role === 'ADMIN',
    login,
    logout,
    switchRole
  };
}
