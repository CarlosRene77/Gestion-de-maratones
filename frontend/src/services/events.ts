import type {
  Categoria,
  EstadisticasEvento,
  Evento,
  EstadoEvento,
  ListResult,
} from '@/types';
import { request, toList } from './api';

export interface EventFilters {
  page?: number;
  limit?: number;
  estado?: EstadoEvento;
  ciudad?: string;
  q?: string;
  desde?: string;
  hasta?: string;
  sort?: 'fecha_evento' | 'nombre_evento' | 'created_at';
  order?: 'asc' | 'desc';
}

export interface EventPayload {
  nombre_evento: string;
  descripcion?: string | null;
  fecha_evento: string;
  ciudad?: string | null;
  lugar_salida?: string | null;
  estado?: EstadoEvento;
  imagen_banner?: string | null;
}

export interface CategoriaPayload {
  nombre_cat: string;
  distancia_km: number;
  cupo_maximo: number;
  precio: number;
  edad_minima?: number | null;
  edad_maxima?: number | null;
  genero: 'M' | 'F' | 'Mixto';
}

export const eventsApi = {
  async list(filters: EventFilters = {}): Promise<ListResult<Evento>> {
    const envelope = await request<Evento[]>({
      method: 'GET',
      url: '/eventos',
      params: filters,
    });
    return toList(envelope);
  },

  async get(id: number | string): Promise<Evento> {
    const envelope = await request<Evento>({ method: 'GET', url: `/eventos/${id}` });
    return envelope.data;
  },

  async create(payload: EventPayload): Promise<Evento> {
    return (await request<Evento>({ method: 'POST', url: '/eventos', data: payload })).data;
  },

  async update(id: number, payload: Partial<EventPayload>): Promise<Evento> {
    return (
      await request<Evento>({ method: 'PUT', url: `/eventos/${id}`, data: payload })
    ).data;
  },

  async changeStatus(id: number, estado: EstadoEvento) {
    return (
      await request<{ id_evento: number; estado: EstadoEvento }>({
        method: 'PATCH',
        url: `/eventos/${id}/estado`,
        data: { estado },
      })
    ).data;
  },

  async remove(id: number) {
    return (await request<{ id_evento: number }>({ method: 'DELETE', url: `/eventos/${id}` }))
      .data;
  },

  async stats(id: number): Promise<EstadisticasEvento> {
    return (
      await request<EstadisticasEvento>({
        method: 'GET',
        url: `/eventos/${id}/estadisticas`,
      })
    ).data;
  },

  async categories(idEvento: number): Promise<Categoria[]> {
    return (
      await request<Categoria[]>({
        method: 'GET',
        url: `/eventos/${idEvento}/categorias`,
      })
    ).data;
  },

  async createCategory(idEvento: number, payload: CategoriaPayload): Promise<Categoria> {
    return (
      await request<Categoria>({
        method: 'POST',
        url: `/eventos/${idEvento}/categorias`,
        data: payload,
      })
    ).data;
  },

  async updateCategory(id: number, payload: Partial<CategoriaPayload>): Promise<Categoria> {
    return (
      await request<Categoria>({
        method: 'PUT',
        url: `/categorias/${id}`,
        data: payload,
      })
    ).data;
  },

  async removeCategory(id: number) {
    return (
      await request<{ id_categoria: number }>({
        method: 'DELETE',
        url: `/categorias/${id}`,
      })
    ).data;
  },

  async getCategory(id: number): Promise<Categoria> {
    return (
      await request<Categoria>({ method: 'GET', url: `/categorias/${id}` })
    ).data;
  },
};
