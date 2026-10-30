import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  Download,
  Package,
  PackageCheck,
  Timer,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useEvents, qk } from '@/hooks/queries';
import { eventsApi } from '@/services/events';
import {
  EVENTO_ESTADO_LABEL,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { EventoBadge } from '@/components/ui/badge';
import { ErrorState, PageHeader, StatCard } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/skeleton';
import type { EstadisticasEvento, Evento } from '@/types';

const GREEN = '#22c55e';
const ORANGE = '#f97316';
const SKY = '#0ea5e9';
const VIOLET = '#8b5cf6';
const SLATE = '#64748b';

const GENDER_COLORS: Record<string, string> = {
  M: SKY,
  F: ORANGE,
  sin_definir: SLATE,
};

const GENDER_LABELS: Record<string, string> = {
  M: 'Varonil',
  F: 'Femenil',
  sin_definir: 'Sin definir',
};

export function AdminDashboardPage() {
  const eventsQuery = useEvents({ limit: 100, sort: 'fecha_evento', order: 'desc' });
  const events = eventsQuery.data?.items ?? [];

  const statsQueries = useQueries({
    queries: events.map((event) => ({
      queryKey: qk.stats(event.id_evento),
      queryFn: () => eventsApi.stats(event.id_evento),
      staleTime: 30_000,
    })),
  });

  const loading = eventsQuery.isLoading || statsQueries.some((query) => query.isLoading);
  const failed = eventsQuery.isError;

  const stats = useMemo(() => {
    const rows: { event: Evento; stats: EstadisticasEvento }[] = [];
    events.forEach((event, index) => {
      const eventStats = statsQueries[index]?.data;
      if (eventStats) rows.push({ event, stats: eventStats });
    });
    return rows;
  }, [events, statsQueries]);

  const aggregate = useMemo(() => {
    const totals = stats.reduce(
      (acc, item) => {
        acc.revenue += Number(item.stats.recaudado || 0);
        acc.runners += Number(item.stats.inscritos_activos || 0);
        acc.delivered += Number(item.stats.kits.entregado || 0);
        acc.pending += Number(item.stats.kits.pendiente || 0);
        acc.marks += Number(item.stats.marcaciones_registradas || 0);
        acc.capacity += Number(item.stats.cupo_total || 0);
        acc.generos.M += Number(item.stats.generos?.M || 0);
        acc.generos.F += Number(item.stats.generos?.F || 0);
        acc.generos.sin_definir += Number(item.stats.generos?.sin_definir || 0);
        return acc;
      },
      {
        revenue: 0,
        runners: 0,
        delivered: 0,
        pending: 0,
        marks: 0,
        capacity: 0,
        generos: { M: 0, F: 0, sin_definir: 0 },
      },
    );
    const kitsTotal = totals.delivered + totals.pending;
    return {
      ...totals,
      kitRate: kitsTotal ? (totals.delivered / kitsTotal) * 100 : 0,
      occupancy: totals.capacity ? (totals.runners / totals.capacity) * 100 : 0,
    };
  }, [stats]);

  const activeEvents = events.filter(
    (event) => event.estado === 'en_curso' || event.estado === 'publicado',
  ).length;

  const revenueData = useMemo(
    () =>
      [...stats]
        .sort((a, b) => Number(b.stats.recaudado) - Number(a.stats.recaudado))
        .slice(0, 6)
        .map((item) => ({
          name:
            item.event.nombre_evento.length > 16
              ? `${item.event.nombre_evento.slice(0, 15)}…`
              : item.event.nombre_evento,
          recaudado: Number(item.stats.recaudado),
          inscritos: Number(item.stats.inscritos_activos),
        })),
    [stats],
  );

  const genderData = useMemo(
    () =>
      (['M', 'F', 'sin_definir'] as const)
        .map((key) => ({
          name: GENDER_LABELS[key],
          value: aggregate.generos[key],
          key,
        }))
        .filter((item) => item.value > 0),
    [aggregate.generos],
  );

  const kitData = useMemo(
    () => [
      { name: 'Entregados', value: aggregate.delivered, color: GREEN },
      { name: 'Pendientes', value: aggregate.pending, color: ORANGE },
    ],
    [aggregate.delivered, aggregate.pending],
  );

  const categoryData = useMemo(() => {
    const map = new Map<string, { name: string; inscritos: number; cupo: number }>();
    stats.forEach((item) => {
      (item.stats.categorias ?? []).forEach((category) => {
        const current = map.get(category.nombre_cat) ?? {
          name: category.nombre_cat,
          inscritos: 0,
          cupo: 0,
        };
        current.inscritos += Number(category.inscritos || 0);
        current.cupo += Number(category.cupo_maximo || 0);
        map.set(category.nombre_cat, current);
      });
    });
    return [...map.values()]
      .sort((a, b) => b.inscritos - a.inscritos)
      .slice(0, 7)
      .map((item) => ({ ...item, name: item.name.length > 14 ? `${item.name.slice(0, 13)}…` : item.name }));
  }, [stats]);

  if (failed) {
    return <ErrorState onRetry={() => void eventsQuery.refetch()} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Direccion ejecutiva"
        title="Dashboard de operacion"
        description="Vision consolidada de recaudacion, inscripciones, entrega de kits y participacion por genero."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/admin/reportes">
                <Download className="h-4 w-4" /> Exportar
              </Link>
            </Button>
            <Button asChild>
              <Link to="/admin/carreras">
                <CalendarDays className="h-4 w-4" /> Gestionar carreras
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Recaudacion total"
          value={formatCurrency(aggregate.revenue)}
          hint={`${formatNumber(aggregate.runners)} inscritos activos`}
          icon={CircleDollarSign}
          accent="brand"
          loading={loading}
        />
        <StatCard
          label="Corredores registrados"
          value={formatNumber(aggregate.runners)}
          hint={`${formatPercent(aggregate.occupancy, 0)} de ocupacion global`}
          icon={Users}
          accent="sky"
          loading={loading}
        />
        <StatCard
          label="Entrega de kits"
          value={formatPercent(aggregate.kitRate, 0)}
          hint={`${formatNumber(aggregate.delivered)} de ${formatNumber(
            aggregate.delivered + aggregate.pending,
          )} kits`}
          icon={PackageCheck}
          accent="orange"
          loading={loading}
        />
        <StatCard
          label="Eventos activos"
          value={formatNumber(activeEvents)}
          hint={`${formatNumber(events.length)} eventos en la plataforma`}
          icon={Trophy}
          accent="violet"
          loading={loading}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <div className="surface p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                Recaudacion por evento
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Top 6 eventos por ingresos verificados.
              </p>
            </div>
            <TrendingUp className="h-5 w-5 text-brand-500" />
          </div>
          <div className="mt-5 h-72 w-full">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : revenueData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.18)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} interval={0} angle={-12} height={48} />
                  <YAxis tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} tickFormatter={(value) => {
                    const amount = Number(value);
                    return amount >= 1000 ? `$${Math.round(amount / 1000)}k` : `$${Math.round(amount)}`;
                  }} />
                  <ChartTooltip
                    formatter={(value) => [formatCurrency(Number(value)), 'Recaudado']}
                    contentStyle={{ borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="recaudado" radius={[8, 8, 0, 0]} fill={GREEN} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Sin datos de recaudacion.
              </div>
            )}
          </div>
        </div>

        <div className="surface p-5">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            Distribucion por genero
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Participacion consolidada de todos los eventos.
          </p>
          <div className="mt-2 h-60 w-full">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : genderData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genderData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} paddingAngle={3} strokeWidth={0}>
                    {genderData.map((item) => (
                      <Cell key={item.key} fill={GENDER_COLORS[item.key]} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(value) => formatNumber(Number(value))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Sin datos de genero.
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center">
            {(['M', 'F', 'sin_definir'] as const).map((key) => (
              <div key={key}>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  {GENDER_LABELS[key]}
                </p>
                <p className="font-display text-lg font-extrabold text-slate-950 dark:text-white">
                  {formatNumber(aggregate.generos[key])}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="surface p-5">
          <h2 className="font-display text-lg font-bold uppercase tracking-tight">
            Estado de kits
          </h2>
          <div className="mt-2 h-56 w-full">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : aggregate.delivered + aggregate.pending ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kitData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80} paddingAngle={4} strokeWidth={0}>
                    {kitData.map((item) => (
                      <Cell key={item.name} fill={item.color} />
                    ))}
                  </Pie>
                  <ChartTooltip formatter={(value) => formatNumber(Number(value))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Sin kits registrados.
              </div>
            )}
          </div>
        </div>

        <div className="surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                Inscripciones por categoria
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Categorias con mayor demanda acumulada.
              </p>
            </div>
            <Package className="h-5 w-5 text-electric-500" />
          </div>
          <div className="mt-4 h-56 w-full">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : categoryData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ left: 8, right: 16, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,.18)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={82} tick={{ fontSize: 10, fill: SLATE }} axisLine={false} tickLine={false} />
                  <ChartTooltip formatter={(value) => formatNumber(Number(value))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="inscritos" radius={[0, 6, 6, 0]} fill={ORANGE} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Sin categorias registradas.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="flex items-center justify-between border-b p-5">
          <div>
            <h2 className="font-display text-lg font-bold uppercase tracking-tight">
              Resumen por evento
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Estado operativo, ocupacion y recaudacion.
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/carreras">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : stats.length ? (
          <div className="divide-y">
            {stats.slice(0, 8).map(({ event, stats: eventStats }) => {
              const kits = eventStats.kits.entregado + eventStats.kits.pendiente;
              const rate = kits ? (eventStats.kits.entregado / kits) * 100 : 0;
              return (
                <div key={event.id_evento} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                        {event.nombre_evento}
                      </p>
                      <EventoBadge estado={event.estado} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {formatDate(event.fecha_evento)} · {event.ciudad || 'Sede por confirmar'} ·{' '}
                      {EVENTO_ESTADO_LABEL[event.estado]}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-right sm:w-auto">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Inscritos</p>
                      <p className="font-display text-base font-extrabold text-slate-950 dark:text-white">
                        {formatNumber(eventStats.inscritos_activos)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Kits</p>
                      <p className="font-display text-base font-extrabold text-slate-950 dark:text-white">
                        {formatPercent(rate, 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Recaudado</p>
                      <p className="font-display text-base font-extrabold text-brand-600 dark:text-brand-400">
                        {formatCurrency(eventStats.recaudado)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Timer className="h-8 w-8 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Aun no hay eventos con estadisticas
            </p>
            <Button size="sm" asChild>
              <Link to="/admin/carreras">Crear primer evento</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
