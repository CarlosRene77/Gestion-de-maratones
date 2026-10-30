import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { AlertTriangle, ArrowLeft, Loader2, RefreshCw, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from './button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog';

export function Progress({
  value,
  className,
  indicatorClassName,
}: {
  value: number;
  className?: string;
  indicatorClassName?: string;
}) {
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800', className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn('h-full rounded-full bg-brand-500 transition-all duration-500', indicatorClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-500', className)} />;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
  backTo,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
  backTo?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {backTo && (
          <Link
            to={backTo}
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500 transition hover:text-brand-500"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Volver
          </Link>
        )}
        {eyebrow && <p className="eyebrow mb-1">{eyebrow}</p>}
        <h1 className="font-display text-3xl font-extrabold uppercase tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = 'brand',
  loading,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  accent?: 'brand' | 'orange' | 'sky' | 'rose' | 'violet';
  loading?: boolean;
}) {
  const accents = {
    brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
    orange: 'bg-electric-500/10 text-electric-600 dark:text-electric-400',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  };
  return (
    <div className="surface group relative overflow-hidden p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {label}
          </p>
          {loading ? (
            <div className="mt-3 h-8 w-28 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
          ) : (
            <p className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {value}
            </p>
          )}
          {hint && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        </div>
        <div className={cn('rounded-xl p-2.5', accents[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-brand-500/5 blur-2xl transition group-hover:bg-brand-500/10" />
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed px-6 py-14 text-center',
        className,
      )}
    >
      <div className="rounded-2xl bg-slate-100 p-3.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 font-display text-xl font-bold uppercase tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'surface flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className,
      )}
    >
      <div className="rounded-full bg-rose-500/10 p-3 text-rose-500">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <div>
        <p className="font-semibold text-slate-900 dark:text-white">No se pudieron cargar los datos</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {message || 'Revisa la conexion con la API e intenta nuevamente.'}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Reintentar
        </Button>
      )}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  loading,
  onConfirm,
  destructive,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmText?: string;
  loading?: boolean;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={destructive ? 'danger' : 'default'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  children,
  side = 'top',
}: {
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={6}
        className="z-50 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-xl dark:bg-slate-100 dark:text-slate-900"
      >
        {children}
        <TooltipPrimitive.Arrow className="fill-slate-900 dark:fill-slate-100" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const parts = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-emerald-700 text-xs font-extrabold text-slate-950',
        className,
      )}
    >
      {parts || 'MH'}
    </div>
  );
}
