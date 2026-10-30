import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  Download,
  FileText,
  Medal,
  Search,
  Timer,
  Trophy,
  UserRound,
} from 'lucide-react';
import { useEvents, useResults } from '@/hooks/queries';
import { resultsApi } from '@/services/results';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { downloadCertificatePdf } from '@/lib/pdf';
import {
  cn,
  formatDate,
  formatDuration,
  formatNumber,
  GENERO_LABEL,
} from '@/lib/utils';
import { SearchInput } from '@/components/SearchInput';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/form';
import { EmptyState, ErrorState, PageHeader } from '@/components/ui/misc';
import { TableSkeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { errorMessage } from '@/services/api';
import type { Certificado, Genero, ResultadoDorsal } from '@/types';

type GenderFilter = '' | Genero;

export function LeaderboardPage() {
  const [params, setParams] = useSearchParams();
  const eventsQuery = useEvents({ limit: 100, sort: 'fecha_evento', order: 'desc' });
  const events = eventsQuery.data?.items ?? [];

  const initialEvent = params.get('evento') || '';
  const [eventId, setEventId] = useState(initialEvent);
  const [gender, setGender] = useState<GenderFilter>('');
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const q = useDebouncedValue(search, 250);
  const [bibSearch, setBibSearch] = useState('');
  const [bibLoading, setBibLoading] = useState(false);
  const [bibResult, setBibResult] = useState<ResultadoDorsal | null>(null);
  const [certificate, setCertificate] = useState<Certificado | null>(null);
  const [certLoading, setCertLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId && events.length) {
      const finished = events.find((event) => event.estado === 'finalizado' || event.estado === 'en_curso');
      setEventId(String((finished ?? events[0]).id_evento));
    }
  }, [events, eventId]);

  useEffect(() => {
    if (eventId) setParams({ evento: eventId }, { replace: true });
    setCategoryId('');
  }, [eventId, setParams]);

  const resultsQuery = useResults(eventId || undefined, {
    genero: gender || undefined,
    id_categoria: categoryId ? Number(categoryId) : undefined,
  });
  const results = resultsQuery.data;

  const rows = useMemo(() => {
    const all = (results?.categorias ?? []).flatMap((category) =>
      category.resultados.map((entry) => ({
        ...entry,
        categoriaNombre: category.nombre_cat,
      })),
    );
    if (!q.trim()) return all;
    const term = q.trim().toLowerCase();
    return all.filter((entry) =>
      [
        String(entry.numero_dorsal),
        entry.corredor.nombre,
        entry.corredor.apellido,
        entry.categoria.nombre_cat,
        `${entry.corredor.nombre} ${entry.corredor.apellido}`,
      ]
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [results, q]);

  const categories = results?.categorias ?? [];

  const lookupBib = async () => {
    const bib = bibSearch.trim();
    if (!/^\d+$/.test(bib)) {
      toast.error('Ingresa un numero de dorsal valido.');
      return;
    }
    setBibLoading(true);
    try {
      const data = await resultsApi.byDorsal(bib);
      setBibResult(data);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBibLoading(false);
    }
  };

  const requestCertificate = async (bib: number) => {
    setCertLoading(String(bib));
    try {
      const data = await resultsApi.certificate(bib);
      setCertificate(data);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setCertLoading(null);
    }
  };

  return (
    <div className="container-page py-12 sm:py-16">
      <PageHeader
        eyebrow="Resultados oficiales"
        title="Leaderboard en vivo"
        description="Busca por dorsal, nombre o categoria. Los tiempos se actualizan automaticamente durante el evento."
        actions={
          <div className="flex gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={bibSearch}
                onChange={(event) => setBibSearch(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && void lookupBib()}
                placeholder="Buscar dorsal..."
                inputMode="numeric"
                className="field w-40 pl-9"
              />
            </div>
            <Button onClick={() => void lookupBib()} loading={bibLoading}>
              <Search className="h-4 w-4" /> Buscar
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Inscritos', value: formatNumber(results?.resumen.inscritos ?? 0), icon: UserRound },
          { label: 'Finalizados', value: formatNumber(results?.resumen.finalizados ?? 0), icon: Trophy },
          { label: 'Categorias', value: formatNumber(results?.resumen.categorias ?? 0), icon: Medal },
          { label: 'Evento', value: results?.evento.nombre_evento ?? '—', icon: Award, small: true },
        ].map((item) => (
          <div key={item.label} className="surface flex items-center gap-3 p-4">
            <div className="rounded-xl bg-brand-500/10 p-2.5 text-brand-600 dark:text-brand-400">
              <item.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                {item.label}
              </p>
              <p
                className={cn(
                  'truncate font-display font-extrabold text-slate-950 dark:text-white',
                  item.small ? 'text-sm' : 'text-xl',
                )}
              >
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border bg-white p-4 lg:flex-row lg:items-center dark:border-slate-800 dark:bg-slate-900/60">
        <Select
          value={eventId}
          onChange={(event) => setEventId(event.target.value)}
          className="lg:w-72"
        >
          {events.map((event) => (
            <option key={event.id_evento} value={event.id_evento}>
              {event.nombre_evento} · {formatDate(event.fecha_evento, 'dd/MM/yyyy')}
            </option>
          ))}
        </Select>
        <Select
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="lg:w-60"
        >
          <option value="">Todas las categorias</option>
          {categories.map((category) => (
            <option key={category.id_categoria} value={category.id_categoria}>
              {category.nombre_cat}
            </option>
          ))}
        </Select>

        <div className="flex gap-1 rounded-xl border bg-slate-100/70 p-1 dark:bg-slate-950/50">
          {[
            { value: '' as GenderFilter, label: 'Todos' },
            { value: 'M' as GenderFilter, label: 'Varonil' },
            { value: 'F' as GenderFilter, label: 'Femenil' },
          ].map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setGender(option.value)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition',
                gender === option.value
                  ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Nombre o dorsal..."
          className="flex-1"
        />
      </div>

      <div className="mt-5">
        {resultsQuery.isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : resultsQuery.isError ? (
          <ErrorState onRetry={() => void resultsQuery.refetch()} />
        ) : rows.length ? (
          <div className="surface overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th className="w-16">Pos.</th>
                    <th className="w-20">Dorsal</th>
                    <th>Corredor</th>
                    <th>Categoria</th>
                    <th className="text-right">Tiempo neto</th>
                    <th className="w-28 text-right">Certificado</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((entry) => (
                    <tr key={entry.numero_dorsal}>
                      <td>
                        {entry.posicion ? (
                          <span
                            className={cn(
                              'inline-flex h-8 w-8 items-center justify-center rounded-lg font-display text-sm font-extrabold',
                              entry.posicion === 1
                                ? 'bg-amber-400/20 text-amber-600 dark:text-amber-300'
                                : entry.posicion === 2
                                  ? 'bg-slate-300/30 text-slate-600 dark:text-slate-300'
                                  : entry.posicion === 3
                                    ? 'bg-orange-500/15 text-orange-600 dark:text-orange-300'
                                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
                            )}
                          >
                            {entry.posicion}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td>
                        <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          #{entry.numero_dorsal}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-emerald-700 text-[10px] font-extrabold text-slate-950">
                            {entry.corredor.nombre[0]}
                            {entry.corredor.apellido[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {entry.corredor.nombre} {entry.corredor.apellido}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {entry.corredor.genero === 'F' ? 'Femenil' : 'Varonil'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className="text-sm text-slate-700 dark:text-slate-200">{entry.categoria.nombre_cat}</p>
                        <p className="text-[11px] text-slate-400">
                          {Number(entry.categoria.distancia_km)}K ·{' '}
                          {GENERO_LABEL[entry.categoria.genero]}
                        </p>
                      </td>
                      <td className="text-right">
                        {entry.finalizado ? (
                          <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                            {formatDuration(entry.tiempo_neto_segundos)}
                          </span>
                        ) : (
                          <Badge variant="info">En carrera</Badge>
                        )}
                      </td>
                      <td className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!entry.finalizado}
                          loading={certLoading === String(entry.numero_dorsal)}
                          onClick={() => void requestCertificate(entry.numero_dorsal)}
                        >
                          <FileText className="h-4 w-4" /> PDF
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Timer}
            title="Aun no hay resultados"
            description="Los tiempos apareceran aqui cuando el staff registre las llegadas a meta o no coincidan con la busqueda."
          />
        )}
      </div>

      <Dialog open={Boolean(certificate)} onOpenChange={(open) => !open && setCertificate(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Certificado oficial</DialogTitle>
            <DialogDescription>
              {certificate?.evento.nombre_evento} · {certificate?.corredor.nombre}{' '}
              {certificate?.corredor.apellido}
            </DialogDescription>
          </DialogHeader>
          {certificate && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Tiempo oficial', value: certificate.tiempo_neto },
                  { label: 'Dorsal', value: `#${certificate.numero_dorsal}` },
                  {
                    label: 'Posicion categoria',
                    value: certificate.posicion_categoria ? `#${certificate.posicion_categoria}` : '—',
                  },
                  {
                    label: 'Posicion genero',
                    value: certificate.posicion_genero ? `#${certificate.posicion_genero}` : '—',
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border bg-slate-50 p-3 dark:bg-slate-900/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {item.label}
                    </p>
                    <p className="mt-1 font-display text-lg font-extrabold text-slate-950 dark:text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <p className="rounded-lg bg-slate-100 p-3 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                Codigo de verificacion: <strong className="text-slate-700 dark:text-slate-200">{certificate.codigo_verificacion}</strong>
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCertificate(null)}>
              Cerrar
            </Button>
            <Button onClick={() => certificate && downloadCertificatePdf(certificate)}>
              <Download className="h-4 w-4" /> Descargar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(bibResult)} onOpenChange={(open) => !open && setBibResult(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resultado por dorsal</DialogTitle>
            <DialogDescription>
              {bibResult?.evento.nombre_evento} · {formatDate(bibResult?.evento.fecha_evento)}
            </DialogDescription>
          </DialogHeader>
          {bibResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border bg-slate-50 p-4 dark:bg-slate-900/60">
                <div>
                  <p className="font-display text-2xl font-extrabold uppercase text-slate-950 dark:text-white">
                    {bibResult.corredor.nombre} {bibResult.corredor.apellido}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Dorsal #{bibResult.numero_dorsal} · {bibResult.categoria.nombre_cat} ·{' '}
                    {Number(bibResult.categoria.distancia_km)}K
                  </p>
                </div>
                <Badge variant={bibResult.finalizado ? 'success' : 'info'}>
                  {bibResult.finalizado ? 'Finalizado' : 'En carrera'}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Salida</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {bibResult.salida ? formatDate(bibResult.salida, 'HH:mm:ss') : '—'}
                  </p>
                </div>
                <div className="rounded-xl border p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Meta</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {bibResult.meta ? formatDate(bibResult.meta, 'HH:mm:ss') : '—'}
                  </p>
                </div>
              </div>
              {bibResult.splits.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Checkpoints
                  </p>
                  {bibResult.splits.map((split) => (
                    <div
                      key={`${split.nombre_punto}-${split.tiempo_marcado}`}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                    >
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {split.nombre_punto}
                      </span>
                      <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {split.desde_salida ?? formatDate(split.tiempo_marcado, 'HH:mm:ss')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBibResult(null)}>
              Cerrar
            </Button>
            <Button onClick={() => bibResult && void requestCertificate(bibResult.numero_dorsal)}>
              <Download className="h-4 w-4" /> Certificado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
