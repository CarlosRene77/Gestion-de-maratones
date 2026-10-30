import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Download,
  FileText,
  Flag,
  MapPin,
  Medal,
  Search,
  Timer,
  Trophy,
} from 'lucide-react';
import { toast } from 'sonner';
import { useDorsalResult, useMyRegistrations } from '@/hooks/queries';
import { resultsApi } from '@/services/results';
import { downloadCertificatePdf } from '@/lib/pdf';
import {
  cn,
  formatCurrency,
  formatDate,
  formatDuration,
  formatNumber,
  GENERO_LABEL,
  isEventPast,
} from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input, FormField } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { EmptyState, ErrorState, PageHeader } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/skeleton';
import type { Inscripcion } from '@/types';

export function MyResultsPage() {
  const [params, setParams] = useSearchParams();
  const { data, isLoading, isError, refetch } = useMyRegistrations();
  const [bib, setBib] = useState('');
  const [queryBib, setQueryBib] = useState('');
  const [certLoading, setCertLoading] = useState(false);

  const registrations = useMemo(
    () =>
      (data?.items ?? [])
        .filter((item) => item.estado_pago !== 'cancelado')
        .sort((a, b) => {
          const aDate = new Date(a.categoria?.evento?.fecha_evento ?? 0).getTime();
          const bDate = new Date(b.categoria?.evento?.fecha_evento ?? 0).getTime();
          return bDate - aDate;
        }),
    [data],
  );

  const selectedId = params.get('inscripcion');
  const selected = useMemo(() => {
    if (selectedId) {
      const found = registrations.find(
        (item) => String(item.id_inscripcion) === String(selectedId),
      );
      if (found) return found;
    }
    return registrations.find((item) => item.numero_dorsal) ?? registrations[0] ?? null;
  }, [registrations, selectedId]);

  useEffect(() => {
    if (selected?.numero_dorsal) {
      setBib(String(selected.numero_dorsal));
      setQueryBib(String(selected.numero_dorsal));
    }
  }, [selected?.id_inscripcion, selected?.numero_dorsal]);

  const resultQuery = useDorsalResult(queryBib, Boolean(queryBib));
  const result = resultQuery.data;
  const notFound = resultQuery.isError;

  const select = (registration: Inscripcion) => {
    setParams({ inscripcion: String(registration.id_inscripcion) }, { replace: true });
    if (registration.numero_dorsal) {
      setBib(String(registration.numero_dorsal));
      setQueryBib(String(registration.numero_dorsal));
    }
  };

  const downloadCertificate = async () => {
    if (!queryBib) return;
    setCertLoading(true);
    try {
      const certificate = await resultsApi.certificate(queryBib);
      downloadCertificatePdf(certificate);
      toast.success('Certificado descargado.');
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'El certificado aun no esta disponible para este dorsal.',
      );
    } finally {
      setCertLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-80" />
        <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  if (!registrations.length) {
    return (
      <EmptyState
        icon={Trophy}
        title="Aun no tienes carreras"
        description="Inscribete en una carrera para consultar tus tiempos y descargar certificados."
        action={
          <Button asChild>
            <Link to="/app/inscribirse">Inscribirme ahora</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mis resultados"
        title="Tiempos y certificados"
        description="Consulta tus marcas oficiales, splits por punto de control y descarga tu certificado digital."
        actions={
          <Button variant="outline" asChild>
            <Link to="/resultados">
              <Trophy className="h-4 w-4" /> Leaderboard publico
            </Link>
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.6fr]">
        <div className="space-y-4">
          <div className="surface p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Mis inscripciones
            </p>
            <div className="mt-3 space-y-2">
              {registrations.map((registration) => {
                const active = registration.id_inscripcion === selected?.id_inscripcion;
                const past = isEventPast(registration.categoria?.evento?.fecha_evento);
                return (
                  <button
                    key={registration.id_inscripcion}
                    type="button"
                    onClick={() => select(registration)}
                    className={cn(
                      'w-full rounded-xl border p-3 text-left transition',
                      active
                        ? 'border-brand-500 bg-brand-500/5'
                        : 'hover:border-slate-300 dark:hover:border-slate-700',
                    )}
                  >
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {registration.categoria?.evento?.nombre_evento ?? 'Evento'}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                      <span>{formatDate(registration.categoria?.evento?.fecha_evento)}</span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                        #{registration.numero_dorsal ?? '—'}
                      </span>
                      {past ? (
                        <Badge variant="neutral">Finalizada</Badge>
                      ) : (
                        <Badge variant="info">Proxima</Badge>
                      )}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="surface p-4">
            <FormField
              label="Buscar por numero de dorsal"
              hint="Puedes consultar el resultado de cualquier dorsal oficial."
            >
              <div className="flex gap-2">
                <Input
                  value={bib}
                  onChange={(event) => setBib(event.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Ej. 1001"
                  inputMode="numeric"
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      setQueryBib(bib);
                    }
                  }}
                />
                <Button variant="outline" onClick={() => setQueryBib(bib)} disabled={!bib}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </FormField>
          </div>
        </div>

        <div className="space-y-5">
          {!queryBib ? (
            <EmptyState
              icon={Timer}
              title="Selecciona una carrera"
              description="Elige una de tus inscripciones o ingresa un dorsal para ver el resultado."
            />
          ) : resultQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-44 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          ) : notFound || !result ? (
            <div className="surface p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                <Timer className="h-7 w-7" />
              </div>
              <h3 className="mt-4 font-display text-xl font-bold uppercase tracking-tight">
                Sin marcas registradas
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Aun no hay tiempos oficiales para el dorsal <strong>#{queryBib}</strong>. Los
                resultados aparecen cuando el personal registra tu salida y tu llegada a meta.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <Button variant="outline" asChild>
                  <Link to="/resultados">Ver resultados del evento</Link>
                </Button>
                <Button onClick={() => void resultQuery.refetch()}>Actualizar</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-3xl border border-brand-500/20 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-6 text-white sm:p-8">
                <div className="absolute inset-0 bg-grid-dark bg-[size:30px_30px] opacity-20" />
                <div className="absolute -right-14 -top-14 h-52 w-52 rounded-full bg-brand-500/20 blur-3xl" />
                <div className="relative">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-400">
                        Resultado oficial
                      </p>
                      <h2 className="mt-1.5 font-display text-2xl font-extrabold uppercase tracking-tight text-white sm:text-3xl">
                        {result.evento.nombre_evento}
                      </h2>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-brand-400" />
                          {formatDate(result.evento.fecha_evento)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-brand-400" />
                          {result.evento.ciudad || 'Sede oficial'}
                        </span>
                      </p>
                    </div>
                    <Badge variant={result.finalizado ? 'success' : 'warning'}>
                      {result.finalizado ? 'Finalizado' : 'En carrera'}
                    </Badge>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-[1.2fr_1fr]">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Tiempo neto
                      </p>
                      <p className="font-display text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
                        {result.tiempo_neto ?? '—'}
                      </p>
                      <p className="mt-1 font-mono text-[11px] text-slate-500">
                        {formatDuration(result.tiempo_neto_segundos)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                          Dorsal
                        </p>
                        <p className="mt-1 font-mono text-xl font-extrabold text-brand-400">
                          {result.numero_dorsal}
                        </p>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                          Categoria
                        </p>
                        <p className="mt-1 truncate font-semibold text-white">
                          {result.categoria.nombre_cat}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {Number(result.categoria.distancia_km)}K ·{' '}
                          {GENERO_LABEL[result.categoria.genero]}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={() => void downloadCertificate()}
                      loading={certLoading}
                      disabled={!result.finalizado}
                    >
                      <Download className="h-4 w-4" /> Descargar certificado
                    </Button>
                    <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10" asChild>
                      <Link to={`/eventos/${result.evento.id_evento}`}>
                        <ArrowRight className="h-4 w-4" /> Ver evento
                      </Link>
                    </Button>
                  </div>
                  {!result.finalizado && (
                    <p className="mt-3 text-[11px] text-amber-300">
                      El certificado se habilita cuando registras tu llegada a meta.
                    </p>
                  )}
                </div>
              </div>

              <div className="surface p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold uppercase tracking-tight">
                    Splits por punto de control
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {formatNumber(result.splits.length)} marcas
                  </span>
                </div>

                {result.splits.length ? (
                  <ol className="mt-4 space-y-0">
                    {result.splits.map((split, index) => (
                      <li key={`${split.id_tiempo ?? split.nombre_punto}-${index}`} className="relative flex gap-4 pb-5 last:pb-0">
                        {index < result.splits.length - 1 && (
                          <span className="absolute left-[13px] top-6 h-full w-px bg-slate-200 dark:bg-slate-800" />
                        )}
                        <span
                          className={cn(
                            'relative z-10 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
                            index === result.splits.length - 1
                              ? 'border-brand-500 bg-brand-500 text-slate-950'
                              : 'border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900',
                          )}
                        >
                          {index === result.splits.length - 1 ? (
                            <Flag className="h-3.5 w-3.5" />
                          ) : (
                            <span className="text-[10px] font-bold">{index + 1}</span>
                          )}
                        </span>
                        <div className="flex flex-1 items-center justify-between gap-3 border-b pb-4 last:border-0 last:pb-0">
                          <div>
                            <p className="text-sm font-semibold uppercase tracking-wide text-slate-900 dark:text-white">
                              {split.nombre_punto}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {formatDate(split.tiempo_marcado, 'HH:mm:ss')} · parcial{' '}
                              {split.parcial ?? '—'}
                            </p>
                          </div>
                          <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                            {split.desde_salida ?? '—'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-4 rounded-xl border border-dashed p-6 text-center text-sm text-slate-400">
                    Sin splits registrados.
                  </p>
                )}

                <div className="mt-4 grid gap-3 border-t pt-4 text-xs sm:grid-cols-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Salida
                    </p>
                    <p className="mt-0.5 font-mono font-semibold text-slate-900 dark:text-white">
                      {result.salida ? formatDate(result.salida, 'HH:mm:ss') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Meta
                    </p>
                    <p className="mt-0.5 font-mono font-semibold text-slate-900 dark:text-white">
                      {result.meta ? formatDate(result.meta, 'HH:mm:ss') : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Chip
                    </p>
                    <p className="mt-0.5 font-mono font-semibold text-slate-900 dark:text-white">
                      {result.chip_code || '—'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="surface flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-2.5">
                  <Medal className="h-5 w-5 text-electric-500" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Compara tu tiempo con el resto de tu categoria en el leaderboard oficial.
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/resultados?evento=${result.evento.id_evento}`}>
                    <FileText className="h-4 w-4" /> Ver clasificacion
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
