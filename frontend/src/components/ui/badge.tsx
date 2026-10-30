import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, EVENTO_ESTADO_LABEL, KIT_ESTADO_LABEL, PAGO_ESTADO_LABEL } from '@/lib/utils';
import type { EstadoEvento, EstadoKit, EstadoPago } from '@/types';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'border-brand-500/25 bg-brand-500/10 text-brand-700 dark:text-brand-300',
        success: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        warning: 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        danger: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300',
        info: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
        neutral:
          'border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
        outline: 'border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-300',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

const eventoVariant: Record<EstadoEvento, BadgeProps['variant']> = {
  borrador: 'neutral',
  publicado: 'success',
  en_curso: 'info',
  finalizado: 'warning',
};

export function EventoBadge({ estado }: { estado: EstadoEvento }) {
  return <Badge variant={eventoVariant[estado]}>{EVENTO_ESTADO_LABEL[estado]}</Badge>;
}

const pagoVariant: Record<EstadoPago, BadgeProps['variant']> = {
  pendiente: 'warning',
  completado: 'success',
  cancelado: 'danger',
};

export function PagoBadge({ estado }: { estado: EstadoPago }) {
  return <Badge variant={pagoVariant[estado]}>{PAGO_ESTADO_LABEL[estado]}</Badge>;
}

const kitVariant: Record<EstadoKit, BadgeProps['variant']> = {
  pendiente: 'warning',
  entregado: 'info',
};

export function KitBadge({ estado }: { estado: EstadoKit }) {
  return <Badge variant={kitVariant[estado]}>{KIT_ESTADO_LABEL[estado]}</Badge>;
}
