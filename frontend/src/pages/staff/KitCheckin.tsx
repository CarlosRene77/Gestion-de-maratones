import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BadgeCheck,
  Camera,
  CameraOff,
  CheckCircle2,
  ClipboardCheck,
  Hash,
  Package,
  PackageCheck,
  RefreshCw,
  ScanLine,
  Shirt,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
import { useEvents, useKits, qk } from '@/hooks/queries';
import { kitsApi, type KitFilters } from '@/services/kits';
import { errorMessage } from '@/services/api';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { parsePass } from '@/lib/pass';
import {
  cn,
  formatDate,
  formatNumber,
  GENERO_LABEL,
  KIT_ESTADO_LABEL,
} from '@/lib/utils';
import { QRScannerPanel } from '@/components/QRScannerPanel';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import { Badge, KitBadge, PagoBadge } from '@/components/ui/badge';
import { FormField, Input, Select } from '@/components/ui/form';
import { EmptyState, PageHeader, StatCard } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Pagination } from '@/components/Pagination';
import type { EstadoKit, Inscripcion } from '@/types';

export function KitCheckinPage() {
  const queryClient = useQueryClient();
  const [eventId, setEventId] = useState('');
  const [status, setStatus] = useState<'' | EstadoKit>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selected, setSelected] = useState<Inscripcion | null>(null);
  const [bibInput, setBibInput] = useState('');
  const [chipInput, setChipInput] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  const debounced = useDebouncedValue(search, 300);

  const eventsQuery = useEvents({ limit: 100, sort: 'fecha_evento', order: 'desc' });
  const events = eventsQuery.data?.items ?? [];

  useEffect(() => {
    if (!eventId && events.length) {
      const active = events.find((event) => event.estado === 'en_curso' || event.estado === 'publicado');
      setEventId(String((active ?? events[0]).id_evento));
    }
  }, [events, eventId]);

  const filters: KitFilters = {
    page,
    limit: 12,
    id_evento: eventId ? Number(eventId) : undefined,
    estado_kit: status || undefined,
    q: debounced || undefined,
  };

  const kitsQuery = useKits(filters, Boolean(eventId));
  const kits = kitsQuery.data?.items ?? [];
  const meta = kitsQuery.data?.meta;

  useEffect(() => {
    setPage(1);
  }, [eventId, status, debounced]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (kitsQuery.isFetching) return;
      void kitsQuery.refetch();
    }, 20_000);
    return () => window.clearInterval(timer);
  }, [kitsQuery]);

  const total = meta?.total ?? 0;

  const currentEvent = events.find((event) => String(event.id_evento) === String(eventId));

  const stats = useMemo(() => {
    const delivered = kits.filter((item) => item.estado_kit === 'entregado').length;
    return { delivered, pageTotal: kits.length };
  }, [kits]);

  const openRegistration = (registration: Inscripcion) => {
    setSelected(registration);
    setBibInput(registration.numero_dorsal ? String(registration.numero_dorsal) : '');
    setChipInput(registration.chip_code ?? '');
  };

  const lookup = async (text: string) => {
    const raw = String(text || '').trim();
    if (!raw) return;
    setLookupLoading(true);
    setScannerOpen(false);
    try {
      const payload = parsePass(raw);
      let registration: Inscripcion | null = null;

      if (payload) {
        registration = await kitsApi.get(payload.id_inscripcion);
      } else {
        const result = await kitsApi.list({
          id_evento: eventId ? Number(eventId) : undefined,
          q: raw,
          limit: 5,
        });
        registration =
          result.items.find(
            (item) => String(item.numero_dorsal) === raw || item.chip_code === raw,
          ) ??
          result.items[0] ??
          null;
      }

      if (!registration) {
        toast.error('No se encontro una inscripcion para el codigo escaneado.');
        return;
      }

      openRegistration(registration);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLookupLoading(false);
    }
  };

  const deliverMutation = useMutation({
    mutationFn: async () => {
      if (!selected) throw new Error('Inscripcion no seleccionada.');
      const bib = bibInput ? Number(bibInput) : undefined;
      if (bibInput && (!Number.isFinite(bib) || Number(bib) <= 0)) {
        throw new Error('El dorsal debe ser un numero positivo.');
      }
      return kitsApi.deliver({
        id_inscripcion: selected.id_inscripcion,
        numero_dorsal: bib,
        chip_code: chipInput || undefined,
      });
    },
    onSuccess: (updated) => {
      toast.success(
        `Kit entregado a ${updated.usuario?.nombre ?? 'corredor'} ${updated.usuario?.apellido ?? ''}.`,
      );
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ['kits'] });
      queryClient.invalidateQueries({ queryKey: qk.myRegistrations() });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const paymentBlocked = selected?.estado_pago !== 'completado';
  const alreadyDelivered = selected?.estado_kit === 'entregado';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Acreditacion"
        title="Entrega de kits"
        description="Escanea el pase digital o busca al corredor manualmente. Verifica el pago y entrega el kit en segundos."
        actions={
          <Button
            variant={scannerOpen ? 'danger' : 'default'}
            onClick={() => setScannerOpen((value) => !value)}
          >
            {scannerOpen ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
            {scannerOpen ? 'Detener camara' : 'Escanear QR'}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Kits filtrados"
          value={formatNumber(total)}
          hint={currentEvent?.nombre_evento ?? 'Selecciona un evento'}
          icon={Package}
          accent="brand"
          loading={kitsQuery.isLoading}
        />
        <StatCard
          label="Entregados en pagina"
          value={formatNumber(stats.delivered)}
          hint={`${stats.pageTotal} registros visibles`}
          icon={PackageCheck}
          accent="sky"
          loading={kitsQuery.isLoading}
        />
        <StatCard
          label="Pendientes en pagina"
          value={formatNumber(stats.pageTotal - stats.delivered)}
          hint="Requieren verificacion"
          icon={TriangleAlert}
          accent="orange"
          loading={kitsQuery.isLoading}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1.6fr]">
        <div className="space-y-4">
          {scannerOpen && (
            <div className="surface p-4">
              <div className="mb-3 flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-brand-500" />
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Camara activa · apunta al QR del corredor
                </p>
              </div>
              <QRScannerPanel active={scannerOpen} onDecoded={(text) => void lookup(text)} />
            </div>
          )}

          <div className="surface space-y-4 p-5">
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-tight">
                Busqueda manual
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Busca por nombre, email, dorsal o chip. Tambien puedes ingresar el dorsal
                directamente.
              </p>
            </div>

            <div className="flex gap-2">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Nombre, email, dorsal o chip"
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => void kitsQuery.refetch()}
                aria-label="Actualizar"
              >
                <RefreshCw className={cn('h-4 w-4', kitsQuery.isFetching && 'animate-spin')} />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Evento">
                <Select value={eventId} onChange={(event) => setEventId(event.target.value)}>
                  {events.map((event) => (
                    <option key={event.id_evento} value={event.id_evento}>
                      {event.nombre_evento}
                    </option>
                  ))}
                </Select>
              </FormField>
              <FormField label="Estado del kit">
                <Select
                  value={status}
                  onChange={(event) => setStatus(event.target.value as '' | EstadoKit)}
                >
                  <option value="">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="entregado">Entregado</option>
                </Select>
              </FormField>
            </div>

            <div className="rounded-xl border border-dashed p-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Entrada rapida por dorsal
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej. 1042"
                  inputMode="numeric"
                  value={bibInput && !selected ? bibInput : ''}
                  onChange={(event) => setBibInput(event.target.value.replace(/\D/g, '').slice(0, 8))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void lookup(bibInput);
                    }
                  }}
                />
                <Button
                  onClick={() => void lookup(bibInput)}
                  loading={lookupLoading}
                  disabled={!bibInput}
                >
                  <ScanLine className="h-4 w-4" /> Verificar
                </Button>
              </div>
            </div>
          </div>

          <div className="surface p-4">
            <p className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <BadgeCheck className="h-4 w-4 shrink-0 text-brand-500" />
              Solo se entregan kits con el pago verificado. Si el corredor no tiene dorsal, el
              sistema asigna uno automaticamente.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold uppercase tracking-tight">
              Corredores del evento
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Actualizacion automatica
            </span>
          </div>

          {kitsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
          ) : kits.length ? (
            <>
              <div className="space-y-2">
                {kits.map((registration) => (
                  <button
                    key={registration.id_inscripcion}
                    type="button"
                    onClick={() => openRegistration(registration)}
                    className={cn(
                      'surface flex w-full items-center justify-between gap-3 p-4 text-left transition hover:border-brand-500/40',
                      selected?.id_inscripcion === registration.id_inscripcion &&
                        'border-brand-500/50',
                    )}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                          registration.estado_kit === 'entregado'
                            ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                            : 'bg-slate-100 text-slate-400 dark:bg-slate-800',
                        )}
                      >
                        {registration.estado_kit === 'entregado' ? (
                          <PackageCheck className="h-5 w-5" />
                        ) : (
                          <Package className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {registration.usuario
                            ? `${registration.usuario.nombre} ${registration.usuario.apellido}`
                            : `Inscripcion #${registration.id_inscripcion}`}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400">
                          <span className="font-mono font-bold text-slate-500 dark:text-slate-300">
                            #{registration.numero_dorsal ?? '—'}
                          </span>
                          <span>{registration.categoria?.nombre_cat}</span>
                          <span>{registration.talla_camiseta ?? 'Sin talla'}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <KitBadge estado={registration.estado_kit ?? 'pendiente'} />
                      <PagoBadge estado={registration.estado_pago} />
                    </div>
                  </button>
                ))}
              </div>
              <Pagination meta={meta} onPage={setPage} className="pt-2" />
            </>
          ) : (
            <EmptyState
              icon={Package}
              title="Sin resultados"
              description={
                debounced
                  ? `No encontramos corredores para "${debounced}".`
                  : 'Aun no hay inscripciones para este evento con el filtro seleccionado.'
              }
              action={
                debounced ? (
                  <Button variant="outline" onClick={() => setSearch('')}>
                    Limpiar busqueda
                  </Button>
                ) : undefined
              }
            />
          )}
        </div>
      </div>

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Verificacion de kit</DialogTitle>
            <DialogDescription>
              Confirma la identidad del corredor y entrega el kit oficial.
            </DialogDescription>
          </DialogHeader>

          {selected && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-slate-50 p-3 dark:bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-emerald-700 text-sm font-extrabold text-slate-950">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {selected.usuario
                        ? `${selected.usuario.nombre} ${selected.usuario.apellido}`
                        : `Inscripcion #${selected.id_inscripcion}`}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {selected.usuario?.email ?? 'Sin email'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <PagoBadge estado={selected.estado_pago} />
                  <KitBadge estado={selected.estado_kit ?? 'pendiente'} />
                </div>
              </div>

              <div className="grid gap-3 text-xs sm:grid-cols-2">
                {[
                  {
                    label: 'Evento',
                    value: selected.categoria?.evento?.nombre_evento ?? '—',
                  },
                  {
                    label: 'Categoria',
                    value: `${selected.categoria?.nombre_cat ?? '—'} · ${Number(
                      selected.categoria?.distancia_km ?? 0,
                    )}K`,
                  },
                  {
                    label: 'Genero',
                    value: selected.usuario?.genero
                      ? GENERO_LABEL[selected.usuario.genero]
                      : selected.categoria?.genero
                        ? GENERO_LABEL[selected.categoria.genero]
                        : '—',
                  },
                  {
                    label: 'Talla registrada',
                    value: selected.talla_camiseta ?? 'Sin talla',
                    icon: Shirt,
                  },
                  {
                    label: 'Fecha de inscripcion',
                    value: formatDate(selected.fecha_inscripcion, 'dd/MM/yyyy HH:mm'),
                  },
                  {
                    label: 'Estado del kit',
                    value: KIT_ESTADO_LABEL[selected.estado_kit ?? 'pendiente'],
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border p-3">
                    <p className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      {item.icon && <item.icon className="h-3 w-3" />}
                      {item.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {paymentBlocked && (
                <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  El pago esta <strong>{selected.estado_pago}</strong>. No se puede entregar el kit
                  hasta que el pago este verificado.
                </div>
              )}

              {alreadyDelivered && (
                <div className="flex items-start gap-2 rounded-xl border border-brand-500/30 bg-brand-500/10 p-3 text-xs text-brand-700 dark:text-brand-300">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  Este kit ya fue entregado. Puedes actualizar el dorsal o el chip si es necesario.
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <FormField label="Numero de dorsal" hint="Se asigna automaticamente si se deja vacio.">
                  <div className="relative">
                    <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      className="pl-9 font-mono"
                      value={bibInput}
                      inputMode="numeric"
                      onChange={(event) =>
                        setBibInput(event.target.value.replace(/\D/g, '').slice(0, 8))
                      }
                      placeholder={selected.numero_dorsal ? String(selected.numero_dorsal) : 'Auto'}
                    />
                  </div>
                </FormField>
                <FormField label="Codigo del chip" hint="Opcional, para cronometraje.">
                  <Input
                    className="font-mono"
                    value={chipInput}
                    onChange={(event) => setChipInput(event.target.value.slice(0, 64))}
                    placeholder="CHIP-0001"
                  />
                </FormField>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelected(null)} disabled={deliverMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => deliverMutation.mutate()}
              loading={deliverMutation.isPending}
              disabled={!selected || paymentBlocked}
            >
              <ClipboardCheck className="h-4 w-4" />
              {alreadyDelivered ? 'Actualizar entrega' : 'Confirmar entrega'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
