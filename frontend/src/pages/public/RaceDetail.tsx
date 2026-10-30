import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Copy,
  MapPin,
  MapPinned,
  Share2,
  ShieldCheck,
  Trophy,
  Users,
  Wallet,
} from 'lucide-react';
import { useEvent } from '@/hooks/queries';
import { eventCapacity, eventDistances, eventMinPrice } from '@/lib/events';
import {
  cn,
  formatCurrency,
  formatDateLong,
  formatNumber,
  GENERO_LABEL,
  isEventPast,
} from '@/lib/utils';
import { Countdown } from '@/components/Countdown';
import { Button } from '@/components/ui/button';
import { EventoBadge } from '@/components/ui/badge';
import { Progress, ErrorState } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const rules = [
  'Presenta tu pase digital con QR y tu documento de identidad para retirar el kit.',
  'El dorsal debe portarse visible en el pecho durante toda la competencia.',
  'El chip de cronometraje es personal e intransferible; su perdida puede anular el tiempo.',
  'Respeta los horarios de salida de tu categoria y las indicaciones del staff.',
  'La organizacion se reserva el derecho de admision y permanencia en el circuito.',
  'Al inscribirte aceptas el reglamento y la politica de reembolsos del evento.',
];

const sponsors = ['Runners Co.', 'Hydra Sport', 'Andes Bank', 'Vitalis', 'Trail Lab', 'MetroFit'];

export function RaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: event, isLoading, isError, refetch } = useEvent(id);
  const [imageError, setImageError] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isLoading) {
    return (
      <div className="container-page space-y-6 py-10">
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-10 w-2/3" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="container-page py-16">
        <ErrorState
          message="La carrera no existe o ya no esta disponible."
          onRetry={() => void refetch()}
        />
        <div className="mt-5 text-center">
          <Button variant="outline" asChild>
            <Link to="/eventos">
              <ArrowLeft className="h-4 w-4" /> Volver al calendario
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const capacity = eventCapacity(event);
  const distances = eventDistances(event);
  const minPrice = eventMinPrice(event);
  const open = event.estado === 'publicado';
  const finished = event.estado === 'finalizado' || isEventPast(event.fecha_evento);
  const mapQuery = [event.lugar_salida, event.ciudad].filter(Boolean).join(', ') || event.nombre_evento;

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.nombre_evento, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Enlace copiado al portapapeles.');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('No se pudo compartir el enlace.');
    }
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          {event.imagen_banner && !imageError ? (
            <img
              src={event.imagen_banner}
              alt={event.nombre_evento}
              onError={() => setImageError(true)}
              className="h-full w-full object-cover opacity-40"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(ellipse_at_top,rgba(34,197,94,.25),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(249,115,22,.2),transparent_55%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/30" />
          <div className="absolute inset-0 bg-grid-dark bg-[size:38px_38px] opacity-25" />
        </div>

        <div className="container-page relative py-12 sm:py-16">
          <Link
            to="/eventos"
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-300 transition hover:text-brand-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Calendario
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <EventoBadge estado={event.estado} />
            {distances.map((distance) => (
              <span
                key={distance}
                className="rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur"
              >
                {distance}K
              </span>
            ))}
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {event.nombre_evento}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-brand-400" />
              {formatDateLong(event.fecha_evento)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-brand-400" />
              {[event.ciudad, event.lugar_salida].filter(Boolean).join(' · ') || 'Sede por confirmar'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-brand-400" />
              {formatNumber(capacity.available)} cupos disponibles
            </span>
          </div>

          {!finished && (
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Cuenta regresiva
                </p>
                <Countdown target={event.fecha_evento} light />
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-8">
          <section className="surface p-6 sm:p-8">
            <p className="eyebrow">Sobre la carrera</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold uppercase tracking-tight">
              Informacion del evento
            </h2>
            <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {event.descripcion ||
                'Una experiencia deportiva disenada para corredores de todos los niveles. Circuito certificado, hidratacion, cronometraje electronico y medalla de participacion para todos los finalistas.'}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { icon: MapPinned, label: 'Sede', value: event.lugar_salida || event.ciudad || 'Por confirmar' },
                { icon: Clock, label: 'Fecha', value: formatDateLong(event.fecha_evento) },
                { icon: Trophy, label: 'Modalidad', value: distances.length ? `${distances.join('K, ')}K` : 'Por confirmar' },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border bg-slate-50 p-4 dark:bg-slate-900/60">
                  <item.icon className="h-4 w-4 text-brand-500" />
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {item.label}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="eyebrow">Categorias y precios</p>
                <h2 className="mt-2 font-display text-2xl font-extrabold uppercase tracking-tight">
                  Elige tu distancia
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {formatNumber(capacity.used)} / {formatNumber(capacity.total)} inscritos
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {event.categorias.length ? (
                event.categorias.map((category) => {
                  const available = category.cupos_disponibles ?? category.cupo_maximo;
                  const full = available <= 0;
                  const percent = category.porcentaje_ocupacion ?? 0;
                  return (
                    <div key={category.id_categoria} className="surface p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-display text-xl font-bold uppercase tracking-tight">
                              {category.nombre_cat}
                            </h3>
                            <span className="rounded-md bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                              {Number(category.distancia_km)}K
                            </span>
                            <span className="rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {GENERO_LABEL[category.genero]}
                            </span>
                          </div>
                          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                            {category.edad_minima !== null || category.edad_maxima !== null
                              ? `Edad ${category.edad_minima ?? 0} a ${category.edad_maxima ?? '+'} anos`
                              : 'Todas las edades'}{' '}
                            · {formatNumber(available)} cupos disponibles
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              Inscripcion
                            </p>
                            <p className="font-display text-2xl font-extrabold text-slate-950 dark:text-white">
                              {formatCurrency(category.precio)}
                            </p>
                          </div>
                          <Button
                            asChild={open && !full}
                            disabled={!open || full}
                            variant={full ? 'outline' : 'default'}
                            size="sm"
                          >
                            {open && !full ? (
                              <Link
                                to={`/app/inscribirse?evento=${event.id_evento}&categoria=${category.id_categoria}`}
                              >
                                Inscribirme <ArrowRight className="h-4 w-4" />
                              </Link>
                            ) : (
                              <span>{full ? 'Cupo agotado' : 'No disponible'}</span>
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        <Progress
                          value={percent}
                          className="h-1.5 flex-1"
                          indicatorClassName={cn(percent >= 100 ? 'bg-rose-500' : percent >= 80 ? 'bg-electric-500' : 'bg-brand-500')}
                        />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {Math.round(percent)}% ocupado
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="surface p-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  Las categorias de esta carrera se anunciaran pronto.
                </div>
              )}
            </div>
          </section>

          <section className="surface overflow-hidden">
            <div className="p-6 sm:p-8">
              <p className="eyebrow">Ruta oficial</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold uppercase tracking-tight">
                Mapa del circuito
              </h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Punto de salida y zona de meta: {mapQuery}
              </p>
            </div>
            <div className="aspect-[16/9] w-full border-t">
              <iframe
                title={`Mapa de ${event.nombre_evento}`}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=14&output=embed`}
                className="h-full w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <div className="surface p-6">
              <ShieldCheck className="h-5 w-5 text-brand-500" />
              <h3 className="mt-3 font-display text-lg font-bold uppercase tracking-tight">
                Reglamento
              </h3>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {rules.map((rule) => (
                  <li key={rule} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" /> {rule}
                  </li>
                ))}
              </ul>
            </div>
            <div className="surface p-6">
              <Wallet className="h-5 w-5 text-electric-500" />
              <h3 className="mt-3 font-display text-lg font-bold uppercase tracking-tight">
                Incluye tu inscripcion
              </h3>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                {[
                  'Kit oficial con playera tecnica y dorsal',
                  'Chip de cronometraje y medalla de finalista',
                  'Hidratacion y estaciones de servicio',
                  'Certificado digital de participacion',
                  'Acceso a resultados y fotos oficiales',
                ].map((item) => (
                  <li key={item} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="surface overflow-hidden">
            <div className="bg-gradient-to-br from-brand-500/15 via-transparent to-electric-500/10 p-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Inscripcion desde
              </p>
              <p className="mt-1 font-display text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
                {minPrice === null ? 'Gratis' : formatCurrency(minPrice)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Pago simulado · Confirmacion inmediata
              </p>
            </div>
            <div className="space-y-4 border-t p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Users className="h-4 w-4" /> Cupos restantes
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {formatNumber(capacity.available)}
                </span>
              </div>
              <Progress value={capacity.total ? (capacity.used / capacity.total) * 100 : 0} />
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <CalendarDays className="h-4 w-4" /> Fecha
                </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatDateLong(event.fecha_evento)}
                </span>
              </div>

              {open ? (
                <Button className="w-full" size="lg" asChild>
                  <Link
                    to={`/app/inscribirse?evento=${event.id_evento}${
                      event.categorias.length === 1 ? `&categoria=${event.categorias[0].id_categoria}` : ''
                    }`}
                  >
                    Comenzar inscripcion <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button className="w-full" size="lg" disabled>
                  Inscripciones cerradas
                </Button>
              )}

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => void share()}>
                  {copied ? <Copy className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {copied ? 'Copiado' : 'Compartir'}
                </Button>
                <Button variant="outline" asChild>
                  <Link to={`/resultados?evento=${event.id_evento}`}>
                    <Trophy className="h-4 w-4" /> Resultados
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="surface p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Patrocinadores oficiales
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {sponsors.map((sponsor) => (
                <div
                  key={sponsor}
                  className="flex h-12 items-center justify-center rounded-lg border bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:bg-slate-900/60"
                >
                  {sponsor}
                </div>
              ))}
            </div>
          </div>

          <div className="surface flex gap-3 p-5">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Compra protegida
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Tu dorsal se asigna automaticamente y tu pase digital queda disponible al
                confirmar el pago.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
