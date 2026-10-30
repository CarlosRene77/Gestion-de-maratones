import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isPast,
  parseISO,
} from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  EstadoEvento,
  EstadoKit,
  EstadoPago,
  GeneroCategoria,
  RolNombre,
  Usuario,
} from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getRole(user?: Usuario | null): RolNombre | null {
  const role = user?.rol?.nombre_rol;
  return role ?? null;
}

export function fullName(user?: Pick<Usuario, 'nombre' | 'apellido'> | null) {
  if (!user) return 'Corredor';
  return `${user.nombre ?? ''} ${user.apellido ?? ''}`.trim();
}

export function initials(name?: string) {
  return (name || 'MH')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join('');
}

export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('es-PA', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('es-PA').format(Number(value || 0));
}

export function formatPercent(value: number | null | undefined, decimals = 0) {
  return `${Number(value || 0).toFixed(decimals)}%`;
}

function asDate(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : parseISO(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value?: string | Date | null, pattern = 'dd MMM yyyy') {
  const date = asDate(value);
  return date ? format(date, pattern, { locale: es }) : '—';
}

export function formatDateLong(value?: string | Date | null) {
  return formatDate(value, "EEEE d 'de' MMMM 'de' yyyy");
}

export function formatDateTime(value?: string | Date | null) {
  return formatDate(value, 'dd MMM yyyy · HH:mm');
}

export function formatTime(value?: string | Date | null) {
  return formatDate(value, 'HH:mm');
}

export function formatRelative(value?: string | Date | null) {
  const date = asDate(value);
  return date ? formatDistanceToNowStrict(date, { addSuffix: true, locale: es }) : '—';
}

export function daysUntil(value?: string | Date | null) {
  const date = asDate(value);
  if (!date) return null;
  return differenceInCalendarDays(date, new Date());
}

export function isEventPast(value?: string | Date | null) {
  const date = asDate(value);
  return date ? isPast(date) : false;
}

export function formatDuration(totalSeconds: number | null | undefined) {
  if (totalSeconds === null || totalSeconds === undefined) return '—';
  const total = Math.max(0, Math.trunc(totalSeconds));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export const EVENTO_ESTADO_LABEL: Record<EstadoEvento, string> = {
  borrador: 'Borrador',
  publicado: 'Publicado',
  en_curso: 'En curso',
  finalizado: 'Finalizado',
};

export const PAGO_ESTADO_LABEL: Record<EstadoPago, string> = {
  pendiente: 'Pendiente',
  completado: 'Verificado',
  cancelado: 'Cancelado',
};

export const KIT_ESTADO_LABEL: Record<EstadoKit, string> = {
  pendiente: 'Pendiente',
  entregado: 'Kit entregado',
};

export const GENERO_LABEL: Record<GeneroCategoria, string> = {
  M: 'Varonil',
  F: 'Femenil',
  Mixto: 'Mixto',
};

export const ROL_LABEL: Record<RolNombre, string> = {
  admin: 'Administrador',
  staff: 'Staff',
  corredor: 'Corredor',
};

export const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
