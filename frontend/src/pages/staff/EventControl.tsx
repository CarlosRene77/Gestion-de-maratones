import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Activity,
  AlarmClock,
  CircleAlert,
  ClipboardList,
  Flag,
  MapPin,
  Radio,
  ScanLine,
  ShieldAlert,
  Timer,
  Trash2,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { useEvents, useTimingFeed, qk } from '@/hooks/queries';
import { timingApi } from '@/services/timing';
import { errorMessage } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import {
  addIncident,
  listIncidents,
  removeIncident,
  resolveIncident,
  TIPO_INCIDENCIA_LABEL,
} from '@/lib/incidents';
import { incidentSchema, type IncidentValues } from '@/lib/schemas';
import { calcularTiempos } from '@/lib/tiempos';
import {
  cn,
  formatDate,
  formatNumber,
  formatRelative,
} from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormField, Input, Select, Textarea } from '@/components/ui/form';
import { EmptyState, PageHeader, StatCard } from '@/components/ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { Incidencia, MarcaTiempo } from '@/types';

const PUNTOS = ['SALIDA', 'KM5', 'KM10', 'KM15', 'KM21', 'KM30', 'KM35', 'KM42', 'META'];

function runnerOf(mark: MarcaTiempo) {
  const user = mark.dorsal?.inscripcion?.usuario;
  if (user) return `${user.nombre} ${user.apellido}`;
  return `Dorsal #${mark.numero_dorsal ?? mark.dorsal?.numero_dorsal ?? '—'}`;
}

export function EventControlPage() {
  const { isAdmin, displayName } = useAuth();
  const queryClient = useQueryClient();
  const [eventId, setEventId] = useState('');
  const [bib, setBib] = useState('');
  const [point, setPoint] = useState('META');
  const [marks, setMarks] = useState<Incidencia[]>([]);

  const eventsQuery = useEvents({ limit: 100, sort: 'fecha_evento', order: 'desc' });
  const events = eventsQuery.data?.items ?? [];

  useEffect(() => {
    if (!eventId && events.length) {
      const active = events.find((event) => event.estado === 'en_curso') ?? events[0];
      setEventId(String(active.id_evento));
    }
  }, [events, eventId]);

  const event = events.find((item) => String(item.id_evento) === String(eventId));
  const feedQuery = useTimingFeed(eventId || undefined, Boolean(eventId));
  const feed = feedQuery.data?.items ?? [];

  useEffect(() => {
    const sync = () => setMarks(eventId ? listIncidents(Number(eventId)) : []);
    sync();
    window.addEventListener('mh:incidents-updated', sync);
    return () => window.removeEventListener('mh:incidents-updated', sync);
  }, [eventId]);

  const incidentForm = useForm<IncidentValues>({
    resolver: zodResolver(incidentSchema),
    defaultValues: { tipo: 'soporte_meta', descripcion: '', id_inscripcion: '' },
  });

  const markMutation = useMutation({
    mutationFn: async () => {
      const numero = Number(bib);
      if (!Number.isFinite(numero) || numero <= 0) throw new Error('Ingresa un dorsal valido.');
      if (!eventId) throw new Error('Selecciona un evento.');
      return timingApi.mark({
        numero_dorsal: numero,
        nombre_punto: point,
        id_evento: Number(eventId),
      });
    },
    onSuccess: (mark) => {
      toast.success(`${point} registrado para el dorsal ${mark.numero_dorsal ?? bib}.`);
      setBib('');
      queryClient.invalidateQueries({ queryKey: qk.timing(eventId, { limit: 100 }) });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const removeMutation = useMutation({
    mutationFn: (idTiempo: number) => timingApi.remove(idTiempo),
    onSuccess: () => {
      toast.success('Marca eliminada.');
      queryClient.invalidateQueries({ queryKey: qk.timing(eventId, { limit: 100 }) });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const incidentMutation = useMutation({
    mutationFn: async (values: IncidentValues) => {
      if (!eventId) throw new Error('Selecciona un evento.');
      return addIncident({
        id_evento: Number(eventId),
        tipo: values.tipo,
        descripcion: values.descripcion,
        id_inscripcion:
          values.id_inscripcion === '' || values.id_inscripcion === undefined
            ? null
            : Number(values.id_inscripcion),
        staff: displayName,
      });
    },
    onSuccess: (incident) => {
      toast.success(`Incidencia ${incident.id} registrada.`);
      incidentForm.reset({ tipo: 'soporte_meta', descripcion: '', id_inscripcion: '' });
      setMarks(eventId ? listIncidents(Number(eventId)) : []);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const stats = useMemo(() => {
    const runners = new Set(
      feed.map((mark) => mark.numero_dorsal ?? mark.dorsal?.numero_dorsal).filter(Boolean),
    );
    const meta = feed.filter((mark) => {
      const name = String(mark.nombre_punto || '').toUpperCase();
      return name === 'META' || name === 'LLEGADA';
    });
    return {
      total: feed.length,
      runners: runners.size,
      finishes: meta.length,
      openIncidents: marks.filter((item) => item.estado === 'abierta').length,
    };
  }, [feed, marks]);

  const latest = feed[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Control de evento"
        title="Cronometraje en vivo"
        description="Registra marcas de paso, consulta el feed oficial y documenta incidencias en la mesa de control."
        actions={
          <div className="flex items-center gap-2 rounded-xl border border-brand-500/25 bg-brand-500/10 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
            <Radio className="h-3.5 w-3.5 animate-pulse" /> En vivo
          </div>
        }
      />

      <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <FormField label="Evento operativo" className="w-full sm:max-w-md">
          <Select value={eventId} onChange={(event) => setEventId(event.target.value)}>
            {events.map((item) => (
              <option key={item.id_evento} value={item.id_evento}>
                {item.nombre_evento} · {formatDate(item.fecha_evento, 'dd/MM/yyyy')}
              </option>
            ))}
          </Select>
        </FormField>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-brand-500" />
            {event?.ciudad || 'Sede por confirmar'}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <AlarmClock className="h-3.5 w-3.5 text-brand-500" />
            Ultima marca: {latest ? formatDate(latest.tiempo_marcado, 'HH:mm:ss') : '—'}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void feedQuery.refetch()}
            loading={feedQuery.isFetching}
          >
            Actualizar
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Marcas registradas" value={formatNumber(stats.total)} icon={Timer} accent="brand" loading={feedQuery.isLoading} />
        <StatCard label="Corredores en pista" value={formatNumber(stats.runners)} icon={Users} accent="sky" loading={feedQuery.isLoading} />
        <StatCard label="Llegadas a meta" value={formatNumber(stats.finishes)} icon={Flag} accent="violet" loading={feedQuery.isLoading} />
        <StatCard label="Incidencias abiertas" value={formatNumber(stats.openIncidents)} icon={ShieldAlert} accent="rose" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          <div className="surface p-5">
            <div className="flex items-center gap-2">
              <ScanLine className="h-4 w-4 text-brand-500" />
              <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                Registrar marca manual
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Para corredores sin chip o como respaldo de la lectura automatica.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <FormField label="Numero de dorsal">
                <Input
                  value={bib}
                  inputMode="numeric"
                  placeholder="Ej. 1042"
                  onChange={(event) => setBib(event.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      markMutation.mutate();
                    }
                  }}
                />
              </FormField>
              <FormField label="Punto de control">
                <Select value={point} onChange={(event) => setPoint(event.target.value)}>
                  {PUNTOS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </Select>
              </FormField>
              <Button
                onClick={() => markMutation.mutate()}
                loading={markMutation.isPending}
                disabled={!bib || !eventId}
              >
                <Timer className="h-4 w-4" /> Marcar
              </Button>
            </div>
          </div>

          <Tabs defaultValue="feed">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="feed">
                <Activity className="h-4 w-4" /> Feed en vivo
              </TabsTrigger>
              <TabsTrigger value="incidents">
                <TriangleAlert className="h-4 w-4" /> Incidencias ({marks.filter((item) => item.estado === 'abierta').length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="feed">
              <div className="surface overflow-hidden">
                {feedQuery.isLoading ? (
                  <div className="space-y-2 p-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} className="h-14 w-full" />
                    ))}
                  </div>
                ) : feed.length ? (
                  <div className="divide-y">
                    {feed.map((mark, index) => {
                      const tiempos = calcularTiempos(
                        mark.dorsal?.tiempos?.length ? mark.dorsal.tiempos : [mark],
                      );
                      return (
                        <div
                          key={`${mark.id_tiempo ?? index}-${mark.tiempo_marcado}`}
                          className="flex items-center justify-between gap-3 px-4 py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 font-mono text-[10px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                              {mark.numero_dorsal ?? mark.dorsal?.numero_dorsal ?? '—'}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {runnerOf(mark)}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {mark.dorsal?.inscripcion?.categoria?.nombre_cat ?? 'Categoria'} ·{' '}
                                {formatRelative(mark.tiempo_marcado)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="info">{mark.nombre_punto}</Badge>
                            <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200">
                              {tiempos.meta ? tiempos.tiempo_neto : formatDate(mark.tiempo_marcado, 'HH:mm:ss')}
                            </span>
                            {isAdmin && mark.id_tiempo && (
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Eliminar marca"
                                onClick={() => removeMutation.mutate(mark.id_tiempo!)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={Timer}
                    title="Sin marcas todavia"
                    description="Las marcas apareceran aqui en cuanto el personal registre salidas y llegadas."
                  />
                )}
              </div>
            </TabsContent>

            <TabsContent value="incidents">
              <div className="surface overflow-hidden">
                {marks.length ? (
                  <div className="divide-y">
                    {marks.map((incident) => (
                      <div key={incident.id} className="flex items-start justify-between gap-3 px-4 py-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={incident.estado === 'abierta' ? 'warning' : 'success'}>
                              {incident.estado === 'abierta' ? 'Abierta' : 'Resuelta'}
                            </Badge>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {TIPO_INCIDENCIA_LABEL[incident.tipo]}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">{incident.id}</span>
                          </div>
                          <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                            {incident.descripcion}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {formatDate(incident.creada_en, 'dd/MM HH:mm')} · {incident.staff ?? 'Staff'}
                            {incident.id_inscripcion ? ` · Inscripcion #${incident.id_inscripcion}` : ''}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          {incident.estado === 'abierta' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                resolveIncident(incident.id);
                                setMarks(listIncidents(Number(eventId)));
                              }}
                            >
                              Resolver
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Eliminar incidencia"
                            onClick={() => {
                              removeIncident(incident.id);
                              setMarks(listIncidents(Number(eventId)));
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-slate-400" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={CircleAlert}
                    title="Sin incidencias"
                    description="Registra cambios de talla, dorsales extraviados o soporte en meta."
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <form
          onSubmit={incidentForm.handleSubmit((values) => incidentMutation.mutate(values))}
          className="surface h-fit space-y-4 p-5"
        >
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-electric-500" />
            <h2 className="font-display text-lg font-bold uppercase tracking-tight">
              Reportar incidencia
            </h2>
          </div>
          <FormField label="Tipo" error={incidentForm.formState.errors.tipo?.message}>
            <Select {...incidentForm.register('tipo')}>
              {(Object.keys(TIPO_INCIDENCIA_LABEL) as Incidencia['tipo'][]).map((type) => (
                <option key={type} value={type}>
                  {TIPO_INCIDENCIA_LABEL[type]}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField
            label="Inscripcion relacionada"
            hint="Opcional, si la incidencia esta ligada a un corredor."
            error={incidentForm.formState.errors.id_inscripcion?.message}
          >
            <Input
              inputMode="numeric"
              placeholder="Ej. 42"
              {...incidentForm.register('id_inscripcion')}
            />
          </FormField>
          <FormField
            label="Descripcion"
            error={incidentForm.formState.errors.descripcion?.message}
          >
            <Textarea
              rows={4}
              placeholder="Describe lo ocurrido, ubicacion y acciones tomadas..."
              {...incidentForm.register('descripcion')}
            />
          </FormField>
          <Button type="submit" className="w-full" loading={incidentMutation.isPending}>
            <TriangleAlert className="h-4 w-4" /> Registrar incidencia
          </Button>
          <p className={cn('text-[10px] leading-relaxed text-slate-400')}>
            Las incidencias se guardan localmente en este dispositivo para la coordinacion
            inmediata del equipo operativo.
          </p>
        </form>
      </div>
    </div>
  );
}
