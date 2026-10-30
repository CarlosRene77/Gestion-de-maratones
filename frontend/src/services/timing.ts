import type { MarcaTiempo, ListResult } from '@/types';
import { request, toList } from './api';

export interface TimingFilters {
  page?: number;
  limit?: number;
  punto?: string;
  desde?: string;
  hasta?: string;
  numero_dorsal?: number;
  id_categoria?: number;
}

export const timingApi = {
  async byEvent(idEvento: number | string, filters: TimingFilters = {}) {
    const envelope = await request<MarcaTiempo[]>({
      method: 'GET',
      url: `/cronometraje/evento/${idEvento}`,
      params: filters,
    });
    return toList(envelope);
  },

  async mark(payload: {
    id_dorsal?: number;
    numero_dorsal?: number;
    nombre_punto: string;
    tiempo_marcado?: string;
    id_evento?: number;
  }) {
    return (
      await request<MarcaTiempo>({
        method: 'POST',
        url: '/cronometraje/marcar',
        data: payload,
      })
    ).data;
  },

  async update(
    idTiempo: number,
    payload: { nombre_punto?: string; tiempo_marcado?: string },
  ) {
    return (
      await request<MarcaTiempo>({
        method: 'PUT',
        url: `/cronometraje/${idTiempo}`,
        data: payload,
      })
    ).data;
  },

  async remove(idTiempo: number) {
    return (
      await request<{ id_tiempo: number }>({
        method: 'DELETE',
        url: `/cronometraje/${idTiempo}`,
      })
    ).data;
  },
};
