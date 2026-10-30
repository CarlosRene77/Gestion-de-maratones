import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Download,
  FileSpreadsheet,
  Package,
  Sheet,
  Trophy,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { useEventStats, useEvents } from '@/hooks/queries';
import { registrationsApi } from '@/services/registrations';
import { kitsApi } from '@/services/kits';
import { usersApi } from '@/services/users';
import { resultsApi } from '@/services/results';
import { errorMessage } from '@/services/api';
import { exportCsv, exportXlsx, type ExportRow } from '@/lib/export';
import {
  EVENTO_ESTADO_LABEL,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  GENERO_LABEL,
  ROL_LABEL,
} from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FormField, Select } from '@/components/ui/form';
import { PageHeader, Progress, StatCard } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/skeleton';
import type { Usuario } from '@/types';

async function fetchAllPages<T>(
  fetcher: (page: number) => Promise<{ items: T[]; meta: { hasNext: boolean } }>,
) {
  const items: T[] = [];
  let page = 1;
  let guard = 0;
  while (guard < 60) {
    const result = await fetcher(page);
    items.push(...result.items);
    if (!result.meta.hasNext) break;
    page += 1;
    guard += 1;
  }
  return items;
}

type ReportKey = 'inscripciones' | 'kits' | 'usuarios' | 'resultados' | 'ejecutivo';

export function ReportsPage() {
  const eventsQuery = useEvents({ limit: 100, sort: 'fecha_evento', order: 'desc' });
  const events = eventsQuery.data?.items ?? [];
  const [eventId, setEventId] = useState('');
  const [busy, setBusy] = useState<ReportKey | null>(null);

  useEffect(() => {
    if (!eventId && events.length) {
      const active = events.find((event) => event.estado === 'en_curso' || event.estado === 'finalizado');
      setEventId(String((active ?? events[0]).id_evento));
    }
  }, [events, eventId]);

  const event = events.find((item) => String(item.id_evento) === String(eventId));
  const statsQuery = useEventStats(eventId || undefined, Boolean(eventId));
  const stats = statsQuery.data;

  const period = event ? `${event.nombre_evento} · ${formatDate(event.fecha_evento, 'yyyy-MM-dd')}` : 'Evento';
  const slug = event ? `evento-${event.id_evento}` : 'marathonhub';

  const summary = useMemo(() => {
    if (!stats) return null;
    const totalKits = stats.kits.entregado + stats.kits.pendiente;
    return {
      runners: Number(stats.inscritos_activos),
      revenue: Number(stats.recaudado),
      kitRate: totalKits ? (stats.kits.entregado / totalKits) * 100 : 0,
      capacity: Number(stats.cupo_total),
      occupancy: stats.cupo_total ? (stats.inscritos_activos / stats.cupo_total) * 100 : 0,
    };
  }, [stats]);

  const exportRegistrations = async (format: 'csv' | 'xlsx') => {
    setBusy('inscripciones');
    try {
      const rows = await fetchAllPages((page) =>
        registrationsApi.list({
          page,
          limit: 100,
          id_evento: eventId ? Number(eventId) : undefined,
        }),
      );
      const data: ExportRow[] = rows.map((item) => ({
        Correo: item.usuario?.email ?? '',
        Corredor: item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : '',
        Dorsal: item.numero_dorsal ?? '',
        Categoria: item.categoria?.nombre_cat ?? '',
        Distancia_km: item.categoria?.distancia_km ?? '',
        Evento: item.categoria?.evento?.nombre_evento ?? '',
        Talla: item.talla_camiseta ?? '',
        Estado_pago: item.estado_pago,
        Estado_kit: item.estado_kit ?? 'pendiente',
        Precio: Number(item.categoria?.precio ?? 0),
        Transaccion: item.codigo_transaccion ?? '',
        Fecha: formatDate(item.fecha_inscripcion, 'yyyy-MM-dd HH:mm'),
      }));
      if (!data.length) {
        toast.warning('No hay inscripciones para exportar.');
        return;
      }
      if (format === 'xlsx') {
        exportXlsx([{ name: 'Inscripciones', rows: data }], `inscripciones-${slug}.xlsx`);
      } else {
        exportCsv(data, `inscripciones-${slug}.csv`);
      }
      toast.success(`${formatNumber(data.length)} inscripciones exportadas.`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const exportKits = async (format: 'csv' | 'xlsx') => {
    setBusy('kits');
    try {
      const rows = await fetchAllPages((page) =>
        kitsApi.list({
          page,
          limit: 100,
          id_evento: eventId ? Number(eventId) : undefined,
        }),
      );
      const data: ExportRow[] = rows.map((item) => ({
        Dorsal: item.numero_dorsal ?? '',
        Corredor: item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : '',
        Correo: item.usuario?.email ?? '',
        Categoria: item.categoria?.nombre_cat ?? '',
        Talla: item.talla_camiseta ?? '',
        Chip: item.chip_code ?? '',
        Estado_pago: item.estado_pago,
        Estado_kit: item.estado_kit ?? 'pendiente',
        Entregado_por: item.entregado_por ?? '',
      }));
      if (!data.length) {
        toast.warning('No hay kits para exportar.');
        return;
      }
      if (format === 'xlsx') {
        exportXlsx([{ name: 'Kits', rows: data }], `kits-${slug}.xlsx`);
      } else {
        exportCsv(data, `kits-${slug}.csv`);
      }
      toast.success(`${formatNumber(data.length)} kits exportados.`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const exportUsers = async (format: 'csv' | 'xlsx') => {
    setBusy('usuarios');
    try {
      const rows = await fetchAllPages((page) => usersApi.list({ page, limit: 100 }));
      const data: ExportRow[] = rows.map((user: Usuario) => ({
        Nombre: `${user.nombre} ${user.apellido}`,
        Email: user.email,
        Rol: user.rol?.nombre_rol ? ROL_LABEL[user.rol.nombre_rol] : '',
        Estado: user.estado_cuenta ?? 'activo',
        Telefono: user.telefono ?? '',
        Genero: user.genero ?? '',
        Nacimiento: user.fecha_nacimiento ?? '',
        Alta: formatDate(user.createdAt ?? user.created_at, 'yyyy-MM-dd'),
      }));
      if (!data.length) {
        toast.warning('No hay usuarios para exportar.');
        return;
      }
      if (format === 'xlsx') {
        exportXlsx([{ name: 'Usuarios', rows: data }], `usuarios-${slug}.xlsx`);
      } else {
        exportCsv(data, `usuarios-${slug}.csv`);
      }
      toast.success(`${formatNumber(data.length)} usuarios exportados.`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const exportResults = async (format: 'csv' | 'xlsx') => {
    if (!eventId) return;
    setBusy('resultados');
    try {
      const result = await resultsApi.byEvent(eventId);
      const data: ExportRow[] = result.categorias.flatMap((category) =>
        category.resultados.map((row) => ({
          Categoria: category.nombre_cat,
          Distancia_km: category.distancia_km,
          Posicion: row.posicion ?? '',
          Dorsal: row.numero_dorsal,
          Corredor: `${row.corredor.nombre} ${row.corredor.apellido}`,
          Genero: row.corredor.genero ?? '',
          Finalizado: row.finalizado ? 'Si' : 'No',
          Tiempo_neto: row.tiempo_neto ?? '',
          Salida: row.salida ? formatDate(row.salida, 'HH:mm:ss') : '',
          Meta: row.meta ? formatDate(row.meta, 'HH:mm:ss') : '',
          Splits: row.splits.length,
        })),
      );
      if (!data.length) {
        toast.warning('No hay resultados oficiales para este evento.');
        return;
      }
      if (format === 'xlsx') {
        exportXlsx([{ name: 'Resultados', rows: data }], `resultados-${slug}.xlsx`);
      } else {
        exportCsv(data, `resultados-${slug}.csv`);
      }
      toast.success(`${formatNumber(data.length)} resultados exportados.`);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const exportExecutive = () => {
    if (!stats) return;
    setBusy('ejecutivo');
    try {
      const resumen: ExportRow[] = [
        {
          Evento: stats.nombre_evento,
          Estado: EVENTO_ESTADO_LABEL[stats.estado],
          Cupo_total: stats.cupo_total,
          Inscritos: stats.inscritos_activos,
          Recaudado: Number(stats.recaudado),
          Kits_entregados: stats.kits.entregado,
          Kits_pendientes: stats.kits.pendiente,
          Marcaciones: stats.marcaciones_registradas,
        },
      ];
      const categorias: ExportRow[] = stats.categorias.map((category) => ({
        Categoria: category.nombre_cat,
        Cupo: category.cupo_maximo,
        Inscritos: category.inscritos,
        Precio: Number(category.precio),
        Ocupacion: category.cupo_maximo
          ? `${((category.inscritos / category.cupo_maximo) * 100).toFixed(1)}%`
          : '0%',
      }));
      const tallas: ExportRow[] = Object.entries(stats.tallas).map(([size, count]) => ({
        Talla: size,
        Solicitadas: Number(count),
      }));
      const generos: ExportRow[] = (
        [
          ['M', stats.generos.M],
          ['F', stats.generos.F],
          ['sin_definir', stats.generos.sin_definir],
        ] as const
      ).map(([key, value]) => ({
        Genero: key === 'sin_definir' ? 'Sin definir' : GENERO_LABEL[key],
        Participantes: Number(value),
      }));
      const pagos: ExportRow[] = Object.entries(stats.inscripciones).map(([state, count]) => ({
        Estado_pago: state,
        Total: Number(count),
      }));

      exportXlsx(
        [
          { name: 'Resumen', rows: resumen },
          { name: 'Categorias', rows: categorias },
          { name: 'Tallas', rows: tallas },
          { name: 'Generos', rows: generos },
          { name: 'Pagos', rows: pagos },
        ],
        `reporte-ejecutivo-${slug}.xlsx`,
      );
      toast.success('Reporte ejecutivo generado.');
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusy(null);
    }
  };

  const cards: {
    key: ReportKey;
    title: string;
    description: string;
    icon: typeof FileSpreadsheet;
    accent: string;
    onExport: (format: 'csv' | 'xlsx') => void;
  }[] = [
    {
      key: 'inscripciones',
      title: 'Inscripciones y pagos',
      description: 'Corredores, dorsales, categorias, tallas, estado de pago y transacciones.',
      icon: Users,
      accent: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
      onExport: (format) => void exportRegistrations(format),
    },
    {
      key: 'kits',
      title: 'Entrega de kits',
      description: 'Acreditaciones, chips, tallas y estado de entrega por corredor.',
      icon: Package,
      accent: 'bg-electric-500/10 text-electric-600 dark:text-electric-400',
      onExport: (format) => void exportKits(format),
    },
    {
      key: 'resultados',
      title: 'Resultados oficiales',
      description: 'Clasificacion por categoria, tiempos netos, salidas, metas y splits.',
      icon: Trophy,
      accent: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
      onExport: (format) => void exportResults(format),
    },
    {
      key: 'usuarios',
      title: 'Usuarios y roles',
      description: 'Padron completo de cuentas, roles, estado de acceso y contacto.',
      icon: Users,
      accent: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
      onExport: (format) => void exportUsers(format),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Reportes"
        title="Exportacion de datos"
        description="Genera archivos CSV o Excel listos para contabilidad, operaciones y comunicacion con patrocinadores."
        actions={
          <Button onClick={exportExecutive} loading={busy === 'ejecutivo'} disabled={!stats}>
            <BarChart3 className="h-4 w-4" /> Reporte ejecutivo
          </Button>
        }
      />

      <div className="surface flex flex-col gap-3 p-4 lg:flex-row lg:items-end lg:justify-between">
        <FormField label="Evento base" className="w-full lg:max-w-md">
          <Select value={eventId} onChange={(changeEvent) => setEventId(changeEvent.target.value)}>
            {events.map((item) => (
              <option key={item.id_evento} value={item.id_evento}>
                {item.nombre_evento}
              </option>
            ))}
          </Select>
        </FormField>
        <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <CalendarDays className="h-3.5 w-3.5" />
          {period}
        </p>
      </div>

      {statsQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28" />
          ))}
        </div>
      ) : summary ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Inscritos" value={formatNumber(summary.runners)} hint={`${formatNumber(summary.capacity)} cupos`} icon={Users} accent="brand" />
            <StatCard label="Recaudado" value={formatCurrency(summary.revenue)} hint="Pagos verificados" icon={Sheet} accent="orange" />
            <StatCard label="Ocupacion" value={formatPercent(summary.occupancy, 0)} hint="Sobre cupo total" icon={BarChart3} accent="sky" />
            <StatCard label="Kits entregados" value={formatPercent(summary.kitRate, 0)} hint="Avance de acreditacion" icon={Package} accent="violet" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <div key={card.key} className="surface flex flex-col p-5">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.accent}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-3 font-display text-base font-bold uppercase tracking-tight">
                  {card.title}
                </h2>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  {card.description}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    loading={busy === card.key}
                    onClick={() => card.onExport('csv')}
                  >
                    CSV
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    loading={busy === card.key}
                    onClick={() => card.onExport('xlsx')}
                  >
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                  Composicion del evento
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Vista rapida antes de exportar el paquete ejecutivo.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={exportExecutive} loading={busy === 'ejecutivo'}>
                <Download className="h-4 w-4" /> Descargar paquete
              </Button>
            </div>
            <div className="mt-5 grid gap-5 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Genero
                </p>
                <div className="mt-2 space-y-2 text-xs">
                  {(['M', 'F'] as const).map((key) => {
                    const total = stats!.generos.M + stats!.generos.F + stats!.generos.sin_definir;
                    const value = stats!.generos[key];
                    return (
                      <div key={key}>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-slate-400">{GENERO_LABEL[key]}</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {formatNumber(value)}
                          </span>
                        </div>
                        <Progress value={total ? (value / total) * 100 : 0} className="mt-1 h-1.5" />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Top tallas
                </p>
                <div className="mt-2 space-y-1.5 text-xs">
                  {Object.entries(stats!.tallas)
                    .sort((a, b) => Number(b[1]) - Number(a[1]))
                    .slice(0, 4)
                    .map(([size, count]) => (
                      <div key={size} className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">{size}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {formatNumber(count)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Top categorias
                </p>
                <div className="mt-2 space-y-1.5 text-xs">
                  {[...stats!.categorias]
                    .sort((a, b) => b.inscritos - a.inscritos)
                    .slice(0, 4)
                    .map((category) => (
                      <div key={category.id_categoria} className="flex justify-between gap-2">
                        <span className="truncate text-slate-500 dark:text-slate-400">
                          {category.nombre_cat}
                        </span>
                        <span className="shrink-0 font-semibold text-slate-900 dark:text-white">
                          {formatNumber(category.inscritos)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="surface p-8 text-center text-sm text-slate-400">
          Selecciona un evento para ver el resumen de reportes.
        </div>
      )}
    </div>
  );
}
