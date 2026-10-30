import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Boxes,
  Download,
  Package,
  PackageCheck,
  PackageSearch,
  RefreshCw,
  Shirt,
  TriangleAlert,
} from 'lucide-react';
import { useEventStats, useEvents, useKits, qk } from '@/hooks/queries';
import { kitsApi } from '@/services/kits';
import { errorMessage } from '@/services/api';
import { exportCsv, exportXlsx } from '@/lib/export';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  TALLAS,
} from '@/lib/utils';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import { Badge, KitBadge, PagoBadge } from '@/components/ui/badge';
import { FormField, Select } from '@/components/ui/form';
import { EmptyState, ErrorState, PageHeader, Progress, StatCard } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/Pagination';
import type { EstadoKit, Inscripcion } from '@/types';

export function AdminKitsPage() {
  const queryClient = useQueryClient();
  const [eventId, setEventId] = useState('');
  const [status, setStatus] = useState<'' | EstadoKit>('pendiente');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const eventsQuery = useEvents({ limit: 100, sort: 'fecha_evento', order: 'desc' });
  const events = eventsQuery.data?.items ?? [];

  useEffect(() => {
    if (!eventId && events.length) {
      const active = events.find((event) => event.estado === 'en_curso' || event.estado === 'publicado');
      setEventId(String((active ?? events[0]).id_evento));
    }
  }, [events, eventId]);

  const event = events.find((item) => String(item.id_evento) === String(eventId));
  const statsQuery = useEventStats(eventId || undefined, Boolean(eventId));
  const stats = statsQuery.data;

  const kitsQuery = useKits(
    {
      page,
      limit: 8,
      id_evento: eventId ? Number(eventId) : undefined,
      estado_kit: status || undefined,
      q: search || undefined,
    },
    Boolean(eventId),
  );
  const kits = kitsQuery.data?.items ?? [];

  useEffect(() => {
    setPage(1);
  }, [eventId, status, search]);

  const deliverMutation = useMutation({
    mutationFn: (registration: Inscripcion) =>
      kitsApi.deliver({
        id_inscripcion: registration.id_inscripcion,
        numero_dorsal: registration.numero_dorsal ?? undefined,
        chip_code: registration.chip_code ?? undefined,
      }),
    onSuccess: () => {
      toast.success('Kit marcado como entregado.');
      queryClient.invalidateQueries({ queryKey: ['kits'] });
      queryClient.invalidateQueries({ queryKey: qk.stats(eventId) });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const totals = useMemo(() => {
    const delivered = Number(stats?.kits.entregado ?? 0);
    const pending = Number(stats?.kits.pendiente ?? 0);
    const total = delivered + pending;
    return {
      delivered,
      pending,
      total,
      rate: total ? (delivered / total) * 100 : 0,
    };
  }, [stats]);

  const sizeRows = useMemo(() => {
    const tallas = stats?.tallas ?? {};
    return TALLAS.map((size) => ({
      size,
      count: Number(tallas[size] ?? 0),
    }));
  }, [stats]);

  const maxSize = Math.max(1, ...sizeRows.map((row) => row.count));

  const exportInventory = (format: 'csv' | 'xlsx') => {
    if (!stats) return;
    const rows = [
      {
        Evento: stats.nombre_evento,
        Estado: stats.estado,
        Cupo_total: stats.cupo_total,
        Inscritos: stats.inscritos_activos,
        Kits_entregados: totals.delivered,
        Kits_pendientes: totals.pending,
        Recaudado: Number(stats.recaudado),
      },
      ...sizeRows.map((row) => ({
        Evento: stats.nombre_evento,
        Talla: row.size,
        Solicitadas: row.count,
      })),
      ...(stats.categorias ?? []).map((category) => ({
        Evento: stats.nombre_evento,
        Categoria: category.nombre_cat,
        Cupo: category.cupo_maximo,
        Inscritos: category.inscritos,
        Precio: Number(category.precio),
      })),
    ];
    const filename = `inventario-kits-${stats.id_evento}`;
    if (format === 'xlsx') {
      exportXlsx(
        [
          { name: 'Resumen', rows: rows.slice(0, 1) },
          { name: 'Tallas', rows: rows.slice(1, 1 + sizeRows.length) },
          {
            name: 'Categorias',
            rows: rows.slice(1 + sizeRows.length),
          },
        ],
        `${filename}.xlsx`,
      );
    } else {
      exportCsv(rows, `${filename}.csv`);
    }
    toast.success('Inventario exportado.');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inventario"
        title="Kits y acreditaciones"
        description="Controla la entrega de kits, la demanda por talla y la ocupacion de cada categoria."
        actions={
          <>
            <Button variant="outline" onClick={() => exportInventory('csv')} disabled={!stats}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button variant="outline" onClick={() => exportInventory('xlsx')} disabled={!stats}>
              <Download className="h-4 w-4" /> Excel
            </Button>
          </>
        }
      />

      <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between">
        <FormField label="Evento" className="w-full sm:max-w-md">
          <Select value={eventId} onChange={(changeEvent) => setEventId(changeEvent.target.value)}>
            {events.map((item) => (
              <option key={item.id_evento} value={item.id_evento}>
                {item.nombre_evento}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <span>{event?.ciudad || 'Sede por confirmar'}</span>
          <span>{formatNumber(totals.total)} kits esperados</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void statsQuery.refetch();
              void kitsQuery.refetch();
            }}
            loading={statsQuery.isFetching || kitsQuery.isFetching}
          >
            <RefreshCw className="h-3.5 w-3.5" /> Actualizar
          </Button>
        </div>
      </div>

      {statsQuery.isError ? (
        <ErrorState onRetry={() => void statsQuery.refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Kits entregados" value={formatNumber(totals.delivered)} hint="Acreditados" icon={PackageCheck} accent="brand" loading={statsQuery.isLoading} />
            <StatCard label="Kits pendientes" value={formatNumber(totals.pending)} hint="Por entregar" icon={TriangleAlert} accent="orange" loading={statsQuery.isLoading} />
            <StatCard label="Avance de entrega" value={formatPercent(totals.rate, 0)} hint={`${formatNumber(totals.total)} kits totales`} icon={Package} accent="sky" loading={statsQuery.isLoading} />
            <StatCard label="Recaudacion" value={formatCurrency(stats?.recaudado)} hint={`${formatNumber(stats?.inscritos_activos)} inscritos`} icon={Boxes} accent="violet" loading={statsQuery.isLoading} />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <div className="surface p-5">
              <div className="flex items-center gap-2">
                <Shirt className="h-5 w-5 text-electric-500" />
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                  Demanda por talla
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Playeras solicitadas segun inscripciones confirmadas.
              </p>
              {statsQuery.isLoading ? (
                <div className="mt-4 space-y-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {sizeRows.map((row) => (
                    <div key={row.size}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          {row.size}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {formatNumber(row.count)}
                        </span>
                      </div>
                      <Progress
                        value={(row.count / maxSize) * 100}
                        className="mt-1 h-1.5"
                        indicatorClassName="bg-electric-500"
                      />
                    </div>
                  ))}
                  <div className="flex items-center justify-between border-t pt-2 text-[11px] text-slate-400">
                    <span>Sin talla</span>
                    <span>{formatNumber(stats?.tallas.sin_talla ?? 0)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="surface overflow-hidden">
              <div className="flex items-center justify-between border-b p-5">
                <div>
                  <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                    Ocupacion por categoria
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cupos, inscritos y precio de lista.
                  </p>
                </div>
                <PackageSearch className="h-5 w-5 text-brand-500" />
              </div>
              {statsQuery.isLoading ? (
                <div className="space-y-2 p-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full" />
                  ))}
                </div>
              ) : stats?.categorias.length ? (
                <div className="divide-y">
                  {stats.categorias.map((category) => {
                    const percent = category.cupo_maximo
                      ? (category.inscritos / category.cupo_maximo) * 100
                      : 0;
                    return (
                      <div key={category.id_categoria} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {category.nombre_cat}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <Progress value={percent} className="h-1 w-24" />
                            <span className="text-[10px] text-slate-400">
                              {formatNumber(category.inscritos)}/{formatNumber(category.cupo_maximo)}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {formatCurrency(category.precio)}
                          </p>
                          <p className="text-[10px] text-slate-400">{formatPercent(percent, 0)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-slate-400">
                  Sin categorias configuradas.
                </div>
              )}
            </div>
          </div>

          <div className="surface overflow-hidden">
            <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                  Control de entrega
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Entrega kits directamente desde el panel administrativo.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Nombre, dorsal o chip"
                  className="sm:w-64"
                />
                <Select
                  value={status}
                  onChange={(changeEvent) => setStatus(changeEvent.target.value as '' | EstadoKit)}
                  className="sm:w-40"
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="entregado">Entregados</option>
                </Select>
              </div>
            </div>

            {kitsQuery.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full" />
                ))}
              </div>
            ) : kits.length ? (
              <>
                <div className="divide-y">
                  {kits.map((registration) => (
                    <div
                      key={registration.id_inscripcion}
                      className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                            {registration.usuario
                              ? `${registration.usuario.nombre} ${registration.usuario.apellido}`
                              : `Inscripcion #${registration.id_inscripcion}`}
                          </p>
                          <Badge variant="neutral">#{registration.numero_dorsal ?? '—'}</Badge>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {registration.categoria?.nombre_cat} · Talla{' '}
                          {registration.talla_camiseta ?? '—'} · {registration.usuario?.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <PagoBadge estado={registration.estado_pago} />
                        <KitBadge estado={registration.estado_kit ?? 'pendiente'} />
                        {registration.estado_kit !== 'entregado' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deliverMutation.mutate(registration)}
                            loading={
                              deliverMutation.isPending &&
                              deliverMutation.variables?.id_inscripcion === registration.id_inscripcion
                            }
                            disabled={registration.estado_pago !== 'completado'}
                          >
                            <PackageCheck className="h-3.5 w-3.5" /> Entregar
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4">
                  <Pagination meta={kitsQuery.data?.meta} onPage={setPage} />
                </div>
              </>
            ) : (
              <EmptyState
                icon={Package}
                title="Sin kits en esta vista"
                description="Ajusta el filtro o la busqueda para ver otras inscripciones."
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
