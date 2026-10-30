import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import type { ApiEnvelope, PaginationMeta } from '@/types';
import { useAuthStore } from '@/store/auth';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const http = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiEnvelope<unknown>>) => {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data;
    const message =
      payload?.message ||
      (status === 0
        ? 'No se pudo conectar con el servidor. Verifica que la API este en linea.'
        : 'Ocurrio un error inesperado.');

    if (status === 401 && useAuthStore.getState().token) {
      useAuthStore.getState().logout();
      window.dispatchEvent(new CustomEvent('mh:session-expired'));
    }

    return Promise.reject(
      new ApiError(message, status, payload?.error?.code, payload?.error?.details),
    );
  },
);

export async function request<T>(config: AxiosRequestConfig): Promise<ApiEnvelope<T>> {
  const response = await http.request<ApiEnvelope<T>>(config);
  return response.data;
}

export function toList<T>(envelope: ApiEnvelope<T[]>): {
  items: T[];
  meta: PaginationMeta;
} {
  return {
    items: envelope.data ?? [],
    meta:
      envelope.meta ?? {
        page: 1,
        limit: (envelope.data ?? []).length,
        total: (envelope.data ?? []).length,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
  };
}

export function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Ocurrio un error inesperado.';
}
