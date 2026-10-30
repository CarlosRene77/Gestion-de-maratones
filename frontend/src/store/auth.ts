import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '@/types';

interface AuthState {
  token: string | null;
  user: Usuario | null;
  setSession: (token: string, user: Usuario) => void;
  setUser: (user: Usuario) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setSession: (token, user) => set({ token, user }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'mh-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
);

export function authToken() {
  return useAuthStore.getState().token;
}
