import type { TiempoCheckpoint } from '@/types';
import { formatDuration } from './utils';

function norm(point?: string | null) {
  return String(point || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

export interface TiempoCalculado {
  salida: string | null;
  meta: string | null;
  finalizado: boolean;
  tiempo_neto_segundos: number | null;
  tiempo_neto: string;
  splits: {
    nombre_punto: string;
    tiempo_marcado: string;
    desde_salida: string;
    desde_salida_segundos: number | null;
  }[];
}

export type MarcaTiempoLike = Pick<TiempoCheckpoint, 'nombre_punto' | 'tiempo_marcado'>;

export function calcularTiempos(tiempos: MarcaTiempoLike[] = []): TiempoCalculado {
  const ordenados = [...tiempos]
    .filter((t) => t?.tiempo_marcado)
    .sort(
      (a, b) =>
        new Date(a.tiempo_marcado).getTime() - new Date(b.tiempo_marcado).getTime(),
    );

  const salida = ordenados.find((t) => norm(t.nombre_punto) === 'SALIDA');
  const meta = ordenados.find((t) => norm(t.nombre_punto) === 'META');
  const base = salida ? new Date(salida.tiempo_marcado).getTime() : null;
  const neto =
    base !== null && meta
      ? Math.max(0, Math.round((new Date(meta.tiempo_marcado).getTime() - base) / 1000))
      : null;

  return {
    salida: salida?.tiempo_marcado ?? null,
    meta: meta?.tiempo_marcado ?? null,
    finalizado: Boolean(meta),
    tiempo_neto_segundos: neto,
    tiempo_neto: formatDuration(neto),
    splits: ordenados.map((t) => {
      const fecha = new Date(t.tiempo_marcado).getTime();
      const seconds = base !== null ? Math.max(0, Math.round((fecha - base) / 1000)) : null;
      return {
        nombre_punto: t.nombre_punto,
        tiempo_marcado: t.tiempo_marcado,
        desde_salida: formatDuration(seconds),
        desde_salida_segundos: seconds,
      };
    }),
  };
}
