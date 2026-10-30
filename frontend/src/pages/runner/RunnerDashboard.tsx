import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  Shirt,
  Timer,
  Trophy,
  Users,
} from 'lucide-react';
import { useMyRegistrations } from '@/hooks/queries';
import { useAuth } from '@/hooks/useAuth';
import {
  cn,
  formatDate,
  formatDateLong,
  formatNumber,
  isEventPast,
} from '@/lib/utils';
import { Countdown } from '@/components/Countdown';
import { Button } from '@/components/ui/button';
import { KitBadge, PagoBadge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/misc';
import { EmptyState, ErrorState, PageHeader, StatCard } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/skeleton';
import type { Inscripcion } from '@/types';

function registrationDate(registration?: Inscripcion | null) {
  return registration?.categoria?.evento?.fecha_evento ?? null;
}

function prepProgress(registration: Inscripcion) {
  const date = registrationDate(registration);
  if (!date) return 25;
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return 100;
  if (days > 90) return 20;
  return Math.min(100, Math.max(20, Math.round(((90 - days) / 90) * 100)));
}

function prepLabel(progress: number) {
  if (progress >= 95) return 'Dia de carrera';
  if (progress >= 70) return 'Semana decisiva';
  if (progress >= 45) return 'En preparacion';
  return 'Planificando';
}

function UpcomingCard({ registration }: { registration: Inscripcion }) {
  const event = registration.categoria?.evento;
  const progress = prepProgress(registration);
  const category = registration.categoria;

  return (
    <div className="surface overflow-hidden">
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950">
        {event?.imagen_banner && (
          <img src={event.imagen_banner} alt="" className="h-full w-full object-cover opacity-45" />
        )}
        <div className="absolute inset-0 bg-grid-dark bg-[size:26px_26px] opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-400">
              {formatDate(event?.fecha_evento, "EEE d MMM · HH:mm")}
            </p>
            <h3 className="truncate font-display text-lg font-bold uppercase tracking-tight text-white">
              {event?.nombre_evento}
            </h3>
          </div>
          <PagoBadge estado={registration.estado_pago} />
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-brand-500" />
            {event?.ciudad || 'Sede por confirmar'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Timer className="h-3.5 w-3.5 text-brand-500" />
            {category?.nombre_cat} · {Number(category?.distancia_km)}K
          </span>
          {registration.numero_dorsal && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              Dorsal #{registration.numero_dorsal}
            </span>
          )}
          <KitBadge estado={registration.estado_kit ?? 'pendiente'} />
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-slate-500 dark:text-slate-400">
              Preparacion · {prepLabel(progress)}
            </span>
            <span className="font-bold text-slate-700 dark:text-slate-300">{progress}%</span>
          </div>
          <Progress value={progress} className="mt-1.5" />
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" asChild>
            <Link to={`/app/pase?inscripcion=${registration.id_inscripcion}`}>
              <QrCode className="h-4 w-4" /> Mi pase
            </Link>
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link to={`/eventos/${event?.id_evento ?? ''}`}>Ver evento</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function RunnerDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useMyRegistrations();
  const registrations = (data?.items ?? []).filter((item) => item.estado_pago !== 'cancelado');

  const { upcoming, past } = useMemo(() => {
    const up: Inscripcion[] = [];
    const old: Inscripcion[] = [];
    registrations.forEach((registration) => {
      const date = registrationDate(registration);
      if (date && !isEventPast(date)) up.push(registration);
      else old.push(registration);
    });
    up.sort(
      (a, b) =>
        new Date(registrationDate(a) || 0).getTime() - new Date(registrationDate(b) || 0).getTime(),
    );
    old.sort(
      (a, b) =>
        new Date(registrationDate(b) || 0).getTime() - new Date(registrationDate(a) || 0).getTime(),
    );
    return { upcoming: up, past: old };
  }, [registrations]);

  const nextRace = upcoming[0];
  const kitsDelivered = registrations.filter((item) => item.estado_kit === 'entregado').length;
  const paid = registrations.filter((item) => item.estado_pago === 'completado').length;
  const nextDate = registrationDate(nextRace ?? registrations[0]) ?? null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Hola, ${user?.nombre ?? 'corredor'}`}
        title="Mi panel de corredor"
        description="Tu proxima carrera, preparacion, pase digital y resultados en un solo lugar."
        actions={
          <Button asChild>
            <Link to="/app/inscribirse">
              <CalendarPlus className="h-4 w-4" /> Nueva inscripcion
            </Link>
          </Button>
        }
      />

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Carreras inscritas"
              value={formatNumber(registrations.length)}
              hint={`${paid} con pago verificado`}
              icon={Trophy}
              accent="brand"
            />
            <StatCard
              label="Proximas carreras"
              value={formatNumber(upcoming.length)}
              hint={nextRace ? formatDate(nextRace.categoria?.evento?.fecha_evento) : 'Sin carreras pendientes'}
              icon={CalendarDays}
              accent="orange"
            />
            <StatCard
              label="Kits entregados"
              value={`${kitsDelivered}/${registrations.length}`}
              hint="Acreditacion oficial"
              icon={Shirt}
              accent="sky"
            />
            <StatCard
              label="Carreras completadas"
              value={formatNumber(past.length)}
              hint="Certificados disponibles"
              icon={Timer}
              accent="violet"
            />
          </div>

          {nextRace && nextDate && (
            <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 sm:p-8">
              <div className="absolute inset-0 bg-grid-dark bg-[size:32px_32px] opacity-25" />
              <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-500/20 blur-3xl" />
              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-400">
                    Tu proxima meta
                  </p>
                  <h2 className="mt-1.5 font-display text-3xl font-extrabold uppercase tracking-tight text-white sm:text-4xl">
                    {nextRace.categoria?.evento?.nombre_evento}
                  </h2>
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-brand-400" />
                      {formatDateLong(nextRace.categoria?.evento?.fecha_evento)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-brand-400" />
                      {nextRace.categoria?.nombre_cat}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-brand-400" />
                      {nextRace.categoria?.evento?.ciudad || 'Sede por confirmar'}
                    </span>
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Countdown target={nextDate} light />
                  <Button asChild>
                    <Link to={`/app/pase?inscripcion=${nextRace.id_inscripcion}`}>
                      <QrCode className="h-4 w-4" /> Ver pase
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                  Proximas carreras
                </h2>
                <Link
                  to="/eventos"
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400"
                >
                  Explorar <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {upcoming.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {upcoming.map((registration) => (
                    <UpcomingCard key={registration.id_inscripcion} registration={registration} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarPlus}
                  title="Aun no tienes carreras"
                  description="Explora el calendario y asegura tu cupo en la proxima carrera."
                  action={
                    <Button asChild>
                      <Link to="/eventos">
                        Ver carreras <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  }
                />
              )}
            </section>

            <section className="space-y-4">
              <h2 className="font-display text-xl font-bold uppercase tracking-tight">
                Historial reciente
              </h2>
              {past.length ? (
                <div className="space-y-3">
                  {past.slice(0, 5).map((registration) => (
                    <div
                      key={registration.id_inscripcion}
                      className="surface flex items-center justify-between gap-3 p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {registration.categoria?.evento?.nombre_evento}
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-400">
                          <Clock className="h-3 w-3" />
                          {formatDate(registration.categoria?.evento?.fecha_evento)} ·{' '}
                          {Number(registration.categoria?.distancia_km)}K
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link
                          to={`/app/resultados?inscripcion=${registration.id_inscripcion}`}
                        >
                          Tiempos
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="surface p-6 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-slate-300 dark:text-slate-600" />
                  <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Tu historial esta vacio
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Cuando completes tu primera carrera, aqui veras tus tiempos y certificados.
                  </p>
                </div>
              )}

              <div className="surface bg-gradient-to-br from-brand-500/10 to-transparent p-5">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-brand-500" />
                  <p className="font-display text-base font-bold uppercase tracking-tight">
                    Consejo del dia
                  </p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  Manten una hidratacion constante y prueba tu equipamiento en entrenamientos
                  largos antes del dia de la carrera.
                </p>
              </div>
            </section>
          </div>

          <div className={cn('grid gap-4 sm:grid-cols-3')}>
            {[
              { icon: QrCode, title: 'Pase digital', text: 'Presenta tu QR en la entrega del kit.', to: '/app/pase' },
              { icon: Timer, title: 'Mis tiempos', text: 'Consulta splits y descarga certificados.', to: '/app/resultados' },
              { icon: Users, title: 'Resultados publicos', text: 'Compara tu tiempo en el leaderboard.', to: '/resultados' },
            ].map((item) => (
              <Link key={item.title} to={item.to} className="surface group p-5 transition hover:border-brand-500/40">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="mt-3 font-display text-base font-bold uppercase tracking-tight">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.text}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
