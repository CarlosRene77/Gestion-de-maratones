import type { ListResult, Rol, RolNombre, Usuario } from '@/types';
import { request, toList } from './api';

export interface UserFilters {
  page?: number;
  limit?: number;
  rol?: RolNombre;
  estado_cuenta?: 'activo' | 'inactivo';
  q?: string;
}

export interface UserPayload {
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  rol?: RolNombre;
  telefono?: string | null;
  contacto_emergencia?: string | null;
  fecha_nacimiento?: string | null;
  genero?: 'M' | 'F' | null;
  estado_cuenta?: 'activo' | 'inactivo';
}

export const usersApi = {
  async list(filters: UserFilters = {}): Promise<ListResult<Usuario>> {
    const envelope = await request<Usuario[]>({
      method: 'GET',
      url: '/usuarios',
      params: filters,
    });
    return toList(envelope);
  },

  async get(id: number): Promise<Usuario> {
    return (await request<Usuario>({ method: 'GET', url: `/usuarios/${id}` })).data;
  },

  async create(payload: UserPayload & { password: string }): Promise<Usuario> {
    return (await request<Usuario>({ method: 'POST', url: '/usuarios', data: payload })).data;
  },

  async update(id: number, payload: Partial<UserPayload>): Promise<Usuario> {
    return (
      await request<Usuario>({ method: 'PUT', url: `/usuarios/${id}`, data: payload })
    ).data;
  },

  async setStatus(id: number, estado_cuenta: 'activo' | 'inactivo') {
    return (
      await request<{ id_usuario: number; estado_cuenta: string }>({
        method: 'PATCH',
        url: `/usuarios/${id}/estado`,
        data: { estado_cuenta },
      })
    ).data;
  },

  async resetPassword(id: number, password_nueva: string) {
    return (
      await request<{ id_usuario: number }>({
        method: 'PUT',
        url: `/usuarios/${id}/password`,
        data: { password_nueva },
      })
    ).data;
  },

  async roles(): Promise<Rol[]> {
    return (await request<Rol[]>({ method: 'GET', url: '/roles' })).data;
  },
};
