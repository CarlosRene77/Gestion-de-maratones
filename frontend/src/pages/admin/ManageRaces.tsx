import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ArrowUpRight,
  CalendarDays,
  CalendarPlus,
  Layers,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import {
  useEventCategories,
  useEvents,
  qk,
} from '@/hooks/queries';
import { eventsApi, type CategoriaPayload, type EventPayload } from '@/services/events';
import { errorMessage } from '@/services/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  categorySchema,
  eventSchema,
  type CategoryValues,
  type EventValues,
} from '@/lib/schemas';
import {
  cn,
  EVENTO_ESTADO_LABEL,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  GENERO_LABEL,
} from '@/lib/utils';
import { eventCapacity, eventOccupancy } from '@/lib/events';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import { Badge, EventoBadge } from '@/components/ui/badge';
import { FormField, Input, Select, Textarea } from '@/components/ui/form';
import { ConfirmDialog, EmptyState, ErrorState, PageHeader } from '@/components/ui/misc';
import { Progress } from '@/components/ui/misc';
import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';
import { Pagination } from '@/components/Pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Categoria, EstadoEvento, Evento } from '@/types';

function toLocalInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function EventFormDialog({
  open,
  event,
  onOpenChange,
}: {
  open: boolean;
  event: Evento | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<EventValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      nombre_evento: event?.nombre_evento ?? '',
      descripcion: event?.descripcion ?? '',
      fecha_evento: toLocalInput(event?.fecha_evento),
      ciudad: event?.ciudad ?? '',
      lugar_salida: event?.lugar_salida ?? '',
      estado: event?.estado ?? 'borrador',
      imagen_banner: event?.imagen_banner ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: EventValues) => {
      const payload: EventPayload = {
        nombre_evento: values.nombre_evento,
        descripcion: values.descripcion || null,
        fecha_evento: new Date(values.fecha_evento).toISOString(),
        ciudad: values.ciudad || null,
        lugar_salida: values.lugar_salida || null,
        estado: values.estado,
        imagen_banner: values.imagen_banner || null,
      };
      return event
        ? eventsApi.update(event.id_evento, payload)
        : eventsApi.create(payload);
    },
    onSuccess: (saved) => {
      toast.success(event ? 'Carrera actualizada.' : 'Carrera creada.');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: qk.event(saved.id_evento) });
      onOpenChange(false);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{event ? 'Editar carrera' : 'Nueva carrera'}</DialogTitle>
          <DialogDescription>
            Define los datos generales. Las categorias y cupos se gestionan por separado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <FormField label="Nombre del evento" error={form.formState.errors.nombre_evento?.message}>
            <Input placeholder="Maraton de la Ciudad 2026" {...form.register('nombre_evento')} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Fecha y hora" error={form.formState.errors.fecha_evento?.message}>
              <Input type="datetime-local" {...form.register('fecha_evento')} />
            </FormField>
            <FormField label="Estado" error={form.formState.errors.estado?.message}>
              <Select {...form.register('estado')}>
                {(Object.keys(EVENTO_ESTADO_LABEL) as EstadoEvento[]).map((estado) => (
                  <option key={estado} value={estado}>
                    {EVENTO_ESTADO_LABEL[estado]}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Ciudad" error={form.formState.errors.ciudad?.message}>
              <Input placeholder="Ciudad de Panama" {...form.register('ciudad')} />
            </FormField>
            <FormField label="Lugar de salida" error={form.formState.errors.lugar_salida?.message}>
              <Input placeholder="Parque Omar" {...form.register('lugar_salida')} />
            </FormField>
          </div>
          <FormField
            label="Banner (URL)"
            hint="Imagen horizontal 1600x600 recomendada."
            error={form.formState.errors.imagen_banner?.message}
          >
            <Input placeholder="https://..." {...form.register('imagen_banner')} />
          </FormField>
          <FormField label="Descripcion" error={form.formState.errors.descripcion?.message}>
            <Textarea rows={4} placeholder="Reglamento, recorrido, horarios..." {...form.register('descripcion')} />
          </FormField>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {event ? 'Guardar cambios' : 'Crear carrera'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoryFormDialog({
  open,
  event,
  category,
  onOpenChange,
}: {
  open: boolean;
  event: Evento | null;
  category: Categoria | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const form = useForm<CategoryValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      nombre_cat: category?.nombre_cat ?? '',
      distancia_km: category ? Number(category.distancia_km) : 10,
      cupo_maximo: category?.cupo_maximo ?? 100,
      precio: category ? Number(category.precio) : 30,
      genero: category?.genero ?? 'Mixto',
      edad_minima: category?.edad_minima ?? '',
      edad_maxima: category?.edad_maxima ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: CategoryValues) => {
      if (!event) throw new Error('Evento no seleccionado.');
      const payload: CategoriaPayload = {
        nombre_cat: values.nombre_cat,
        distancia_km: Number(values.distancia_km),
        cupo_maximo: Number(values.cupo_maximo),
        precio: Number(values.precio),
        genero: values.genero,
        edad_minima:
          values.edad_minima === '' || values.edad_minima === undefined
            ? null
            : Number(values.edad_minima) || null,
        edad_maxima:
          values.edad_maxima === '' || values.edad_maxima === undefined
            ? null
            : Number(values.edad_maxima) || null,
      };
      return category
        ? eventsApi.updateCategory(category.id_categoria, payload)
        : eventsApi.createCategory(event.id_evento, payload);
    },
    onSuccess: () => {
      toast.success(category ? 'Categoria actualizada.' : 'Categoria creada.');
      queryClient.invalidateQueries({ queryKey: qk.categories(event?.id_evento) });
      queryClient.invalidateQueries({ queryKey: qk.event(event?.id_evento) });
      queryClient.invalidateQueries({ queryKey: qk.stats(event?.id_evento) });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      onOpenChange(false);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? 'Editar categoria' : 'Nueva categoria'}</DialogTitle>
          <DialogDescription>{event?.nombre_evento}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-4">
          <FormField label="Nombre" error={form.formState.errors.nombre_cat?.message}>
            <Input placeholder="10K Libre" {...form.register('nombre_cat')} />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Distancia (km)" error={form.formState.errors.distancia_km?.message}>
              <Input type="number" min={0} step="0.1" {...form.register('distancia_km')} />
            </FormField>
            <FormField label="Genero" error={form.formState.errors.genero?.message}>
              <Select {...form.register('genero')}>
                <option value="Mixto">Mixto</option>
                <option value="F">Femenil</option>
                <option value="M">Varonil</option>
              </Select>
            </FormField>
            <FormField label="Cupo maximo" error={form.formState.errors.cupo_maximo?.message}>
              <Input type="number" min={1} {...form.register('cupo_maximo')} />
            </FormField>
            <FormField label="Precio (USD)" error={form.formState.errors.precio?.message}>
              <Input type="number" min={0} step="0.01" {...form.register('precio')} />
            </FormField>
            <FormField label="Edad minima" error={form.formState.errors.edad_minima?.message}>
              <Input type="number" min={0} placeholder="Sin minimo" {...form.register('edad_minima')} />
            </FormField>
            <FormField label="Edad maxima" error={form.formState.errors.edad_maxima?.message}>
              <Input type="number" min={0} placeholder="Sin maximo" {...form.register('edad_maxima')} />
            </FormField>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={mutation.isPending}>
              {category ? 'Guardar cambios' : 'Crear categoria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CategoriesDialog({
  open,
  event,
  onOpenChange,
}: {
  open: boolean;
  event: Evento | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const categoriesQuery = useEventCategories(event?.id_evento);
  const categories = categoriesQuery.data ?? event?.categorias ?? [];
  const [editing, setEditing] = useState<Categoria | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Categoria | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (category: Categoria) => eventsApi.removeCategory(category.id_categoria),
    onSuccess: () => {
      toast.success('Categoria eliminada.');
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: qk.categories(event?.id_evento) });
      queryClient.invalidateQueries({ queryKey: qk.event(event?.id_evento) });
      queryClient.invalidateQueries({ queryKey: qk.stats(event?.id_evento) });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>Categorias y cupos</DialogTitle>
            <DialogDescription>{event?.nombre_evento}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {categories.length} categorias configuradas
            </p>
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Nueva categoria
            </Button>
          </div>

          {categoriesQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : categories.length ? (
            <div className="max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              {categories.map((category) => {
                const used = Number(category.cupos_ocupados ?? 0);
                const max = Number(category.cupo_maximo ?? 0);
                const percent = max ? (used / max) * 100 : 0;
                return (
                  <div key={category.id_categoria} className="rounded-xl border p-3.5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {category.nombre_cat}
                          </p>
                          <Badge variant="neutral">{Number(category.distancia_km)}K</Badge>
                          <Badge variant="outline">{GENERO_LABEL[category.genero]}</Badge>
                          <Badge variant="info">{formatCurrency(category.precio)}</Badge>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400">
                          {category.edad_minima == null && category.edad_maxima == null
                            ? 'Todas las edades'
                            : `Edad ${category.edad_minima ?? 0}–${category.edad_maxima ?? '+'}`}{' '}
                          · {formatNumber(used)}/{formatNumber(max)} cupos
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar categoria"
                          onClick={() => {
                            setEditing(category);
                            setFormOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Eliminar categoria"
                          onClick={() => setDeleting(category)}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={percent} className="h-1.5" />
                      <span className="w-10 text-right text-[10px] font-bold text-slate-400">
                        {formatPercent(percent, 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Layers}
              title="Sin categorias"
              description="Crea la primera categoria para abrir inscripciones."
              action={
                <Button size="sm" onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4" /> Crear categoria
                </Button>
              }
            />
          )}
        </DialogContent>
      </Dialog>

      <CategoryFormDialog
        key={`${event?.id_evento}-${editing?.id_categoria ?? 'new'}`}
        open={formOpen}
        event={event}
        category={editing}
        onOpenChange={(value) => {
          setFormOpen(value);
          if (!value) setEditing(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(value) => !value && setDeleting(null)}
        title="Eliminar categoria"
        description={`Se eliminara "${deleting?.nombre_cat}". Solo es posible si no tiene inscripciones.`}
        confirmText="Eliminar"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
    </>
  );
}

export function ManageRacesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<'' | EstadoEvento>('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Evento | null>(null);
  const [categoriesEvent, setCategoriesEvent] = useState<Evento | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Evento | null>(null);
  const debounced = useDebouncedValue(search, 300);

  const query = useEvents({
    page,
    limit: 10,
    q: debounced || undefined,
    estado: estado || undefined,
    sort: 'fecha_evento',
    order: 'desc',
  });
  const events = query.data?.items ?? [];
  const meta = query.data?.meta;

  useEffect(() => {
    setPage(1);
  }, [debounced, estado]);

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: number; next: EstadoEvento }) =>
      eventsApi.changeStatus(id, next),
    onSuccess: (data) => {
      toast.success(`Estado actualizado a ${EVENTO_ESTADO_LABEL[data.estado]}.`);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: qk.event(data.id_evento) });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (event: Evento) => eventsApi.remove(event.id_evento),
    onSuccess: () => {
      toast.success('Carrera eliminada.');
      setDeletingEvent(null);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const summary = useMemo(() => {
    const now = Date.now();
    return {
      total: meta?.total ?? events.length,
      upcoming: events.filter((event) => new Date(event.fecha_evento).getTime() > now).length,
      open: events.filter((event) => event.estado === 'publicado').length,
    };
  }, [events, meta]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Gestion de carreras"
        title="Eventos y categorias"
        description="Crea carreras, controla cupos, precios, estados y la configuracion de cada categoria."
        actions={
          <Button
            onClick={() => {
              setEditingEvent(null);
              setFormOpen(true);
            }}
          >
            <CalendarPlus className="h-4 w-4" /> Nueva carrera
          </Button>
        }
      />

      <div className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nombre o ciudad"
          className="flex-1"
        />
        <Select
          value={estado}
          onChange={(event) => setEstado(event.target.value as '' | EstadoEvento)}
          className="sm:w-48"
        >
          <option value="">Todos los estados</option>
          {(Object.keys(EVENTO_ESTADO_LABEL) as EstadoEvento[]).map((key) => (
            <option key={key} value={key}>
              {EVENTO_ESTADO_LABEL[key]}
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> {formatNumber(summary.total)} eventos
          </span>
          <span className="inline-flex items-center gap-1">
            <Search className="h-3.5 w-3.5" /> {formatNumber(summary.open)} publicados
          </span>
        </div>
      </div>

      {query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <TableSkeleton rows={6} cols={5} />
      ) : events.length ? (
        <div className="space-y-3">
          {events.map((event) => {
            const capacity = eventCapacity(event);
            const occupancy = eventOccupancy(event);
            return (
              <div key={event.id_evento} className="surface overflow-hidden">
                <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-900 sm:block">
                      {event.imagen_banner ? (
                        <img src={event.imagen_banner} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-900 to-emerald-950">
                          <TrophyIcon />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-display text-lg font-bold uppercase tracking-tight text-slate-900 dark:text-white">
                          {event.nombre_evento}
                        </p>
                        <EventoBadge estado={event.estado} />
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" /> {formatDate(event.fecha_evento, "dd MMM yyyy · HH:mm")}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {event.ciudad || 'Sede por confirmar'}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Layers className="h-3 w-3" /> {event.categorias?.length ?? 0} categorias
                        </span>
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={occupancy} className="h-1.5 max-w-[220px]" />
                        <span className="text-[10px] font-bold text-slate-400">
                          {formatNumber(capacity.used)}/{formatNumber(capacity.total)} cupos
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={event.estado}
                      onChange={(changeEvent) =>
                        statusMutation.mutate({
                          id: event.id_evento,
                          next: changeEvent.target.value as EstadoEvento,
                        })
                      }
                      className="h-9 w-36 text-xs"
                    >
                      {(Object.keys(EVENTO_ESTADO_LABEL) as EstadoEvento[]).map((key) => (
                        <option key={key} value={key}>
                          {EVENTO_ESTADO_LABEL[key]}
                        </option>
                      ))}
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setCategoriesEvent(event)}>
                      <Layers className="h-4 w-4" /> Categorias
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Editar carrera"
                      onClick={() => {
                        setEditingEvent(event);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Eliminar carrera"
                      onClick={() => setDeletingEvent(event)}
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                    </Button>
                    <Button variant="ghost" size="icon" asChild aria-label="Ver pagina publica">
                      <Link to={`/eventos/${event.id_evento}`} target="_blank">
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          <Pagination meta={meta} onPage={setPage} className="pt-1" />
        </div>
      ) : (
        <EmptyState
          icon={CalendarPlus}
          title="No hay carreras"
          description={
            debounced || estado
              ? 'Ajusta los filtros para encontrar eventos.'
              : 'Crea tu primera carrera para comenzar a recibir inscripciones.'
          }
          action={
            <Button onClick={() => setFormOpen(true)}>
              <CalendarPlus className="h-4 w-4" /> Nueva carrera
            </Button>
          }
        />
      )}

      <EventFormDialog
        key={editingEvent?.id_evento ?? 'new'}
        open={formOpen}
        event={editingEvent}
        onOpenChange={(value) => {
          setFormOpen(value);
          if (!value) setEditingEvent(null);
        }}
      />

      <CategoriesDialog
        open={Boolean(categoriesEvent)}
        event={categoriesEvent}
        onOpenChange={(value) => !value && setCategoriesEvent(null)}
      />

      <ConfirmDialog
        open={Boolean(deletingEvent)}
        onOpenChange={(value) => !value && setDeletingEvent(null)}
        title="Eliminar carrera"
        description={`Se eliminara "${deletingEvent?.nombre_evento}". Esta accion no se puede deshacer y requiere que no tenga inscripciones activas.`}
        confirmText="Eliminar carrera"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => deletingEvent && deleteMutation.mutate(deletingEvent)}
      />
    </div>
  );
}

function TrophyIcon() {
  return (
    <div className={cn('flex h-full w-full items-center justify-center')}>
      <Users className="h-6 w-6 text-brand-400" />
    </div>
  );
}
