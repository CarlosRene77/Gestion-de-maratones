import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { getRole, fullName } from '@/lib/utils';
import { authApi } from '@/services/auth';
import { useQueryClient } from '@tanstack/react-query';
import type { RolNombre } from '@/types';

export function useAuth() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setSession = useAuthStore((state) => state.setSession);
  const setUser = useAuthStore((state) => state.setUser);
  const logoutStore = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const role = getRole(user);
  const isAuthenticated = Boolean(token && user);

  const homeForRole = useCallback((value?: RolNombre | null) => {
    if (value === 'admin') return '/admin';
    if (value === 'staff') return '/staff';
    return '/app';
  }, []);

  const logout = useCallback(async () => {
    try {
      if (token) await authApi.logout();
    } catch {
      // El token puede haber expirado; la sesion local se cierra igual.
    }
    logoutStore();
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [logoutStore, navigate, queryClient, token]);

  return {
    token,
    user,
    role,
    isAuthenticated,
    isAdmin: role === 'admin',
    isStaff: role === 'staff',
    isRunner: role === 'corredor',
    displayName: fullName(user),
    setSession,
    setUser,
    logout,
    homeForRole,
  };
}
