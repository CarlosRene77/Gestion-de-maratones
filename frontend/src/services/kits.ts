import type { EstadoKit, Inscripcion, ListResult } from '@/types';
import { request, toList } from './api';

export interface KitFilters {
  page?: number;
  limit?: number;
  id_evento?: number;
  id_categoria?: number;
  estado_kit?: EstadoKit;
  q?: string;
}

export const kitsApi = {
  async list(filters: KitFilters = {}): Promise<ListResult<Inscripcion>> {
    const envelope = await request<Inscripcion[]>({
      method: 'GET',
      url: '/kits',
      params: filters,
    });
    return toList(envelope);
  },

  async get(idInscripcion: number | string): Promise<Inscripcion> {
    return (
      await request<Inscripcion>({
        method: 'GET',
        url: `/kits/${idInscripcion}`,
      })
    ).data;
  },

  async deliver(payload: {
    id_inscripcion: number;
    numero_dorsal?: number;
    chip_code?: string;
  }): Promise<Inscripcion> {
    return (
      await request<Inscripcion>({
        method: 'PUT',
        url: '/kits/entregar',
        data: payload,
      })
    ).data;
  },
};
