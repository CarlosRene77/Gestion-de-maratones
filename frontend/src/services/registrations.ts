import type { EstadoPago, Inscripcion, ListResult } from '@/types';
import { request, toList } from './api';

export interface RegistrationFilters {
  page?: number;
  limit?: number;
  id_evento?: number;
  id_categoria?: number;
  id_usuario?: number;
  estado_pago?: EstadoPago;
  q?: string;
}

export interface CreateRegistrationPayload {
  id_categoria: number;
  talla_camiseta?: string;
  codigo_transaccion?: string;
  id_usuario?: number;
  estado_pago?: EstadoPago;
}

export interface SimulatedPaymentPayload {
  metodo_pago?: 'tarjeta_simulada' | 'comprobante';
  codigo_transaccion?: string;
  titular?: string;
  ultimos_digitos?: string;
}

export const registrationsApi = {
  async list(filters: RegistrationFilters = {}): Promise<ListResult<Inscripcion>> {
    const envelope = await request<Inscripcion[]>({
      method: 'GET',
      url: '/inscripciones',
      params: filters,
    });
    return toList(envelope);
  },

  async create(payload: CreateRegistrationPayload): Promise<Inscripcion> {
    return (
      await request<Inscripcion>({
        method: 'POST',
        url: '/inscripciones',
        data: payload,
      })
    ).data;
  },

  async get(id: number | string): Promise<Inscripcion> {
    return (
      await request<Inscripcion>({ method: 'GET', url: `/inscripciones/${id}` })
    ).data;
  },

  async paySimulated(id: number, payload: SimulatedPaymentPayload): Promise<Inscripcion> {
    return (
      await request<Inscripcion>({
        method: 'POST',
        url: `/inscripciones/${id}/pago-simulado`,
        data: payload,
      })
    ).data;
  },

  async setPaymentStatus(id: number, estado_pago: EstadoPago): Promise<Inscripcion> {
    return (
      await request<Inscripcion>({
        method: 'PATCH',
        url: `/inscripciones/${id}/pago`,
        data: { estado_pago },
      })
    ).data;
  },

  async cancel(id: number): Promise<Inscripcion> {
    return (
      await request<Inscripcion>({
        method: 'DELETE',
        url: `/inscripciones/${id}`,
      })
    ).data;
  },
};
