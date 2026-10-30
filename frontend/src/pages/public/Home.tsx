import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  QrCode,
  ScanLine,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useEvents } from '@/hooks/queries';
import { eventCapacity, eventDistances, eventMinPrice } from '@/lib/events';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';
import { Countdown } from '@/components/Countdown';
import { EventCard } from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { EventCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/misc';

const steps = [
  {
    icon: CalendarDays,
    title: 'Elige tu carrera',
    text: 'Explora el calendario y selecciona la distancia y categoria que mejor se adapte a tu meta.',
  },
  {
    icon: Zap,
    title: 'Inscribete en linea',
    text: 'Completa tus datos, talla de playera y pago simulado en un wizard de cuatro pasos.',
  },
  {
    icon: QrCode,
    title: 'Recibe tu pase digital',
    text: 'Tu dorsal se asigna al instante y tu pase con QR queda disponible en tu panel.',
  },
  {
    icon: Trophy,
    title: 'Corre y celebra',
    text: 'Consulta tiempos por checkpoint, resultados oficiales y descarga tu certificado PDF.',
  },
];

export function HomePage() {
  const { data, isLoading } = useEvents({
    estado: 'publicado',
    limit: 12,
    sort: 'fecha_evento',
    order: 'asc',
  });

  const events = data?.items ?? [];
  const nextRace = events.find((event) => new Date(event.fecha_evento).getTime() > Date.now()) ?? events[0];
  const capacity = nextRace ? eventCapacity(nextRace) : null;
  const distances = nextRace ? eventDistances(nextRace) : [];

  return (
    <div>
      <section className="relative overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          {nextRace?.imagen_banner ? (
            <img
              src={nextRace.imagen_banner}
              alt=""
              className="h-full w-full object-cover opacity-35"
            />
          ) : (
            <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_left,rgba(34,197,94,.22),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(249,115,22,.18),transparent_55%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-slate-950/40" />
          <div className="absolute inset-0 bg-grid-dark bg-[size:38px_38px] opacity-25" />
        </div>

        <div className="container-page relative py-16 sm:py-24 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
              </span>
              {nextRace ? 'Proxima gran carrera' : 'Temporada 2026'}
            </div>

            <h1 className="mt-5 font-display text-5xl font-extrabold uppercase leading-[0.92] tracking-tight text-white sm:text-6xl lg:text-7xl">
              {nextRace ? (
                <>
                  {nextRace.nombre_evento.split(' ').slice(0, 3).join(' ')}{' '}
                  <span className="text-brand-400">
                    {nextRace.nombre_evento.split(' ').slice(3).join(' ') || '2026'}
                  </span>
                </>
              ) : (
                <>
                  Supera tus <span className="text-brand-400">limites</span>
                </>
              )}
            </h1>

            {nextRace && (
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-brand-400" />
                  {formatDate(nextRace.fecha_evento, "EEEE d 'de' MMMM · HH:mm")}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand-400" />
                  {[nextRace.ciudad, nextRace.lugar_salida].filter(Boolean).join(' · ') || 'Sede por confirmar'}
                </span>
                {capacity && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-brand-400" />
                    {formatNumber(capacity.available)} cupos disponibles
                  </span>
                )}
              </div>
            )}

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
              Inscripciones, pase digital con QR, acreditacion de kits y resultados en vivo.
              Todo lo que necesitas para vivir la carrera de principio a fin.
            </p>

            {nextRace && (
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Countdown target={nextRace.fecha_evento} light />
                <div className="hidden h-12 w-px bg-white/10 sm:block" />
                <div className="flex flex-wrap gap-1.5">
                  {distances.map((distance) => (
                    <span
                      key={distance}
                      className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-bold text-white backdrop-blur"
                    >
                      {distance}K
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link to={nextRace ? `/eventos/${nextRace.id_evento}` : '/eventos'}>
                  {nextRace ? 'Inscribirme ahora' : 'Ver carreras'} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
              >
                <Link to="/resultados">
                  <Trophy className="h-4 w-4" /> Resultados oficiales
                </Link>
              </Button>
            </div>

            {nextRace && eventMinPrice(nextRace) !== null && (
              <p className="mt-5 text-xs text-slate-500">
                Desde{' '}
                <span className="font-bold text-white">{formatCurrency(eventMinPrice(nextRace))}</span>{' '}
                · Cupos limitados · Pago seguro simulado
              </p>
            )}
          </motion.div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
        <div className="container-page grid grid-cols-2 gap-6 py-8 lg:grid-cols-4">
          {[
            { label: 'Eventos activos', value: formatNumber(data?.meta.total || 0), icon: CalendarDays },
            { label: 'Distancias disponibles', value: '5K · 10K · 21K · 42K', icon: Zap },
            { label: 'Tiempo de inscripcion', value: '< 3 minutos', icon: Clock },
            { label: 'Certificados digitales', value: '100% incluidos', icon: Trophy },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className="rounded-xl bg-brand-500/10 p-2.5 text-brand-600 dark:text-brand-400">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  {item.label}
                </p>
                <p className="font-display text-lg font-extrabold text-slate-950 dark:text-white">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Calendario oficial</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight text-slate-950 dark:text-white">
              Proximas carreras
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">
              Encuentra tu proximo reto entre nuestras distancias y categorias. Los cupos se
              actualizan en tiempo real.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/eventos">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          </div>
        ) : events.length ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.slice(0, 6).map((event, index) => (
              <motion.div
                key={event.id_evento}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <EventCard event={event} className="h-full" />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState
              icon={CalendarDays}
              title="Aun no hay carreras publicadas"
              description="Vuelve pronto: los organizadores estan preparando la proxima temporada."
            />
          </div>
        )}
      </section>

      <section id="como-funciona" className="border-y border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-900/30 sm:py-20">
        <div className="container-page">
          <div className="max-w-2xl">
            <p className="eyebrow">Experiencia MarathonHub</p>
            <h2 className="mt-2 font-display text-4xl font-extrabold uppercase tracking-tight text-slate-950 dark:text-white">
              De la inscripcion a la meta
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Un flujo digital pensado para corredores, staff y organizadores.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="surface relative overflow-hidden p-6">
                <span className="absolute right-4 top-3 font-display text-5xl font-extrabold text-slate-100 dark:text-slate-800/70">
                  0{index + 1}
                </span>
                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="relative mt-4 font-display text-lg font-bold uppercase tracking-tight">
                  {step.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-8 sm:p-12">
          <div className="absolute inset-0 bg-grid-dark bg-[size:32px_32px] opacity-25" />
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow">Para organizadores</p>
              <h2 className="mt-2 font-display text-4xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-5xl">
                Gestiona tu carrera como un <span className="text-brand-400">profesional</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-400">
                Dashboard ejecutivo, control de cupos, inventario de kits por talla,
                acreditacion con QR, cronometraje en vivo y exportacion de listas oficiales.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  'KPIs de recaudacion e inscripciones',
                  'Entrega de kits en tiempo real',
                  'Reportes CSV y Excel',
                  'Roles y permisos granulares',
                ].map((text) => (
                  <p key={text} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-brand-400" /> {text}
                  </p>
                ))}
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild>
                  <Link to="/login">
                    Acceder al panel <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-white/20 bg-white/5 text-white hover:border-white/40 hover:bg-white/10"
                >
                  <a href="mailto:hola@marathonhub.com?subject=Quiero%20organizar%20una%20carrera%20con%20MarathonHub">
                    Hablar con ventas
                  </a>
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              {[
                { icon: ScanLine, title: 'Acreditacion express', text: 'Escanea el QR y entrega el kit en menos de 10 segundos.' },
                { icon: Trophy, title: 'Resultados en vivo', text: 'Publica tiempos por checkpoint automaticamente.' },
                { icon: Users, title: 'Listas oficiales', text: 'Exporta inscritos por categoria, talla y estado de pago.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4 text-brand-400" />
                    <p className="font-display text-sm font-bold uppercase tracking-wide text-white">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
