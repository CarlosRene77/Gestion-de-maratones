import type { AuthSession, FichaMedica, Usuario } from '@/types';
import { request } from './api';

export interface RegisterPayload {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  contacto_emergencia?: string;
  fecha_nacimiento?: string;
  genero?: 'M' | 'F';
  ficha_medica_json?: FichaMedica;
  modo_oscuro_pref?: boolean;
}

export interface ProfilePayload {
  nombre?: string;
  apellido?: string;
  telefono?: string | null;
  contacto_emergencia?: string | null;
  fecha_nacimiento?: string | null;
  genero?: 'M' | 'F' | null;
  ficha_medica_json?: FichaMedica | null;
  modo_oscuro_pref?: boolean;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthSession> =>
    (await request<AuthSession>({ method: 'POST', url: '/auth/login', data: { email, password } }))
      .data,

  register: async (payload: RegisterPayload): Promise<AuthSession> =>
    (await request<AuthSession>({ method: 'POST', url: '/auth/register', data: payload })).data,

  me: () => request<Usuario>({ method: 'GET', url: '/auth/me' }),

  updateProfile: (payload: ProfilePayload) =>
    request<Usuario>({ method: 'PUT', url: '/auth/me', data: payload }),

  changePassword: (password_actual: string, password_nueva: string) =>
    request<{ id_usuario: number }>({
      method: 'PUT',
      url: '/auth/password',
      data: { password_actual, password_nueva },
    }),

  updateTheme: (modo_oscuro_pref: boolean) =>
    request<{ modo_oscuro_pref: boolean }>({
      method: 'PUT',
      url: '/auth/preferencias',
      data: { modo_oscuro_pref },
    }),

  logout: () => request<null>({ method: 'POST', url: '/auth/logout' }),
};
