import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, CalendarDays, MapPin, Users } from 'lucide-react';
import type { Evento } from '@/types';
import {
  EVENTO_ESTADO_LABEL,
  formatCurrency,
  formatDate,
  formatNumber,
  cn,
} from '@/lib/utils';
import { eventCapacity, eventDistances, eventMinPrice, eventOccupancy } from '@/lib/events';
import { Badge, EventoBadge } from './ui/badge';
import { Progress } from './ui/misc';

export function EventCard({ event, className }: { event: Evento; className?: string }) {
  const [imageError, setImageError] = useState(false);
  const distances = eventDistances(event);
  const minPrice = eventMinPrice(event);
  const capacity = eventCapacity(event);
  const occupancy = eventOccupancy(event);
  const showImage = event.imagen_banner && !imageError;

  return (
    <Link
      to={`/eventos/${event.id_evento}`}
      className={cn(
        'surface group relative flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-glow',
        className,
      )}
    >
      <div className="relative h-44 overflow-hidden">
        {showImage ? (
          <img
            src={event.imagen_banner!}
            alt={event.nombre_evento}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="noise relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950">
            <div className="absolute inset-0 bg-grid-dark bg-[size:26px_26px] opacity-40" />
            <span className="relative font-display text-6xl font-extrabold tracking-tighter text-white/10">
              {distances.length ? `${Math.max(...distances)}K` : 'RUN'}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/10 to-transparent" />
        <div className="absolute left-4 top-4 flex gap-2">
          <EventoBadge estado={event.estado} />
        </div>
        <div className="absolute right-4 top-4 rounded-xl border border-white/15 bg-slate-950/60 px-2.5 py-1.5 text-center backdrop-blur-md">
          <p className="text-[9px] font-bold uppercase tracking-wider text-brand-400">
            {formatDate(event.fecha_evento, 'MMM')}
          </p>
          <p className="font-display text-xl font-extrabold leading-none text-white">
            {formatDate(event.fecha_evento, 'dd')}
          </p>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex flex-wrap items-center gap-1.5">
            {distances.slice(0, 4).map((distance) => (
              <span
                key={distance}
                className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur"
              >
                {distance}K
              </span>
            ))}
            {!distances.length && (
              <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                Categorias por anunciar
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 font-display text-xl font-bold uppercase leading-tight tracking-tight text-slate-950 transition group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
          {event.nombre_evento}
        </h3>
        <div className="mt-2.5 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-brand-500" />
            {formatDate(event.fecha_evento, "EEE d 'de' MMM · HH:mm")}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-brand-500" />
            <span className="truncate">
              {[event.ciudad, event.lugar_salida].filter(Boolean).join(' · ') || 'Sede por confirmar'}
            </span>
          </p>
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400">
              <Users className="h-3.5 w-3.5" /> {formatNumber(capacity.available)} cupos
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{occupancy}%</span>
          </div>
          <Progress value={occupancy} />
        </div>

        <div className="mt-4 flex items-end justify-between border-t pt-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Desde</p>
            <p className="font-display text-lg font-extrabold text-slate-950 dark:text-white">
              {minPrice === null ? 'Gratis' : formatCurrency(minPrice)}
            </p>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Ver carrera
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
