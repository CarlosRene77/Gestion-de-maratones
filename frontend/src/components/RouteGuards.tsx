import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { getRole } from '@/lib/utils';
import type { RolNombre } from '@/types';
import { useAuthStore } from '@/store/auth';

export function RequireAuth() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  if (!token || !user) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  return <Outlet />;
}

export function RoleRoute({ roles }: { roles: RolNombre[] }) {
  const { isAuthenticated, homeForRole } = useAuth();
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const role = getRole(user);

  if (!isAuthenticated) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  if (!role || !roles.includes(role)) {
    return <Navigate to={homeForRole(role)} replace />;
  }

  return <Outlet />;
}

export function GuestOnly() {
  const { isAuthenticated, role, homeForRole } = useAuth();
  if (isAuthenticated) return <Navigate to={homeForRole(role)} replace />;
  return <Outlet />;
}
