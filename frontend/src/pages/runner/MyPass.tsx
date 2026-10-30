import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  Download,
  Info,
  MapPin,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Shirt,
  Timer,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { useMyRegistrations } from '@/hooks/queries';
import { useAuth } from '@/hooks/useAuth';
import { encodePass, makeNonce, passBib } from '@/lib/pass';
import { downloadReceiptPdf } from '@/lib/pdf';
import {
  cn,
  formatDate,
  formatDateLong,
  GENERO_LABEL,
  isEventPast,
} from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { KitBadge, PagoBadge } from '@/components/ui/badge';
import { EmptyState, ErrorState, PageHeader } from '@/components/ui/misc';
import { Skeleton } from '@/components/ui/skeleton';
import { QRCodeCanvas } from 'qrcode.react';
import type { Inscripcion } from '@/types';

const ROTATION_MS = 30_000;

export function MyPassPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useMyRegistrations();
  const [nonce, setNonce] = useState(makeNonce);
  const [seconds, setSeconds] = useState(0);
  const qrWrap = useRef<HTMLDivElement>(null);

  const registrations = useMemo(
    () =>
      (data?.items ?? [])
        .filter((item) => item.estado_pago !== 'cancelado')
        .sort((a, b) => {
          const aDate = new Date(a.categoria?.evento?.fecha_evento ?? 0).getTime();
          const bDate = new Date(b.categoria?.evento?.fecha_evento ?? 0).getTime();
          const aPast = isEventPast(a.categoria?.evento?.fecha_evento);
          const bPast = isEventPast(b.categoria?.evento?.fecha_evento);
          if (aPast !== bPast) return aPast ? 1 : -1;
          return aPast ? bDate - aDate : aDate - bDate;
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
    return registrations[0] ?? null;
  }, [registrations, selectedId]);

  const select = (registration: Inscripcion) => {
    setParams({ inscripcion: String(registration.id_inscripcion) }, { replace: true });
  };

  useEffect(() => {
    setNonce(makeNonce());
    setSeconds(0);
  }, [selected?.id_inscripcion]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        if (value + 1 >= ROTATION_MS / 1000) {
          setNonce(makeNonce());
          return 0;
        }
        return value + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [selected?.id_inscripcion]);

  const qrValue = selected ? encodePass(selected, nonce) : '';

  const downloadQr = () => {
    const canvas = qrWrap.current?.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `pase-${selected?.numero_dorsal ?? selected?.id_inscripcion}.png`;
    link.click();
    toast.success('Pase QR descargado.');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-80" />
        <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <Skeleton className="h-[430px] w-full rounded-3xl" />
          <Skeleton className="h-72 w-full" />
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
        icon={QrCode}
        title="Aun no tienes pases digitales"
        description="Inscribete en una carrera para generar tu pase con codigo QR dinamico."
        action={
          <Button asChild>
            <Link to="/app/inscribirse">Inscribirme ahora</Link>
          </Button>
        }
      />
    );
  }

  const event = selected?.categoria?.evento;
  const category = selected?.categoria;
  const pendingPayment = selected?.estado_pago !== 'completado';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Pase digital"
        title="Tu acreditacion oficial"
        description="Presenta este codigo QR en la entrega de kits y en los controles del evento. El codigo se renueva automaticamente por seguridad."
        actions={
          <Button variant="outline" asChild>
            <Link to="/app">
              <Timer className="h-4 w-4" /> Mi panel
            </Link>
          </Button>
        }
      />

      {registrations.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {registrations.map((item) => {
            const active = item.id_inscripcion === selected?.id_inscripcion;
            return (
              <button
                key={item.id_inscripcion}
                type="button"
                onClick={() => select(item)}
                className={cn(
                  'shrink-0 rounded-xl border px-3.5 py-2 text-left transition',
                  active
                    ? 'border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300'
                    : 'text-slate-500 hover:border-slate-300 dark:text-slate-400 dark:hover:border-slate-700',
                )}
              >
                <span className="block max-w-[180px] truncate text-xs font-bold uppercase tracking-wider">
                  {item.categoria?.evento?.nombre_evento}
                </span>
                <span className="block text-[10px] text-slate-400">
                  Dorsal #{item.numero_dorsal ?? '—'}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {pendingPayment && (
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Tu pago esta <strong>{selected?.estado_pago}</strong>. El pase es valido solo con el
            pago verificado; completa el pago para asegurar tu kit y tu dorsal.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
          <div className="absolute inset-0 bg-grid-dark bg-[size:30px_30px] opacity-25" />
          <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="absolute -right-16 bottom-0 h-48 w-48 rounded-full bg-electric-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-400">
                  MarathonHub · Pase oficial
                </p>
                <h2 className="mt-2 max-w-sm font-display text-2xl font-extrabold uppercase leading-tight tracking-tight text-white sm:text-3xl">
                  {event?.nombre_evento}
                </h2>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-brand-400" />
                    {formatDateLong(event?.fecha_evento)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-brand-400" />
                    {event?.ciudad || 'Sede por confirmar'}
                  </span>
                </p>
              </div>
              <PagoBadge estado={selected?.estado_pago ?? 'pendiente'} />
            </div>

            <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  Corredor
                </p>
                <p className="mt-1 truncate font-display text-xl font-bold uppercase tracking-tight text-white">
                  {user ? `${user.nombre} ${user.apellido}` : 'Corredor'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Dorsal
                    </p>
                    <p className="mt-0.5 font-mono text-2xl font-extrabold text-brand-400">
                      {selected?.numero_dorsal ?? '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                      Categoria
                    </p>
                    <p className="mt-1 font-semibold text-white">{category?.nombre_cat ?? '—'}</p>
                    <p className="text-[10px] text-slate-400">
                      {Number(category?.distancia_km ?? 0)} km ·{' '}
                      {category ? GENERO_LABEL[category.genero] : '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                    <Shirt className="h-3 w-3 text-brand-400" /> Talla{' '}
                    {selected?.talla_camiseta ?? '—'}
                  </span>
                  <KitBadge estado={selected?.estado_kit ?? 'pendiente'} />
                </div>
              </div>

              <div ref={qrWrap} className="justify-self-center rounded-2xl bg-white p-3 shadow-xl">
                <QRCodeCanvas
                  value={qrValue}
                  size={176}
                  level="M"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#020617"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <RefreshCw className="h-3 w-3 animate-spin text-brand-400 [animation-duration:3s]" />
                Codigo dinamico · se renueva en {Math.max(0, ROTATION_MS / 1000 - seconds)}s
              </p>
              <p className="font-mono text-[10px] text-slate-500">
                {passBib(qrValue) ? `REF ${passBib(qrValue)}` : 'REF —'}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-brand-500" />
              <h3 className="font-display text-lg font-bold uppercase tracking-tight">
                Verificacion
              </h3>
            </div>
            <ul className="mt-3 space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                El QR contiene tu identificador de inscripcion y tu dorsal. El staff lo valida en
                segundos.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                El codigo cambia cada 30 segundos para evitar capturas de pantalla reutilizadas.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
                Presenta tu documento de identidad junto al pase en la acreditacion.
              </li>
            </ul>
          </div>

          <div className="surface space-y-3 p-5">
            <h3 className="font-display text-lg font-bold uppercase tracking-tight">
              Acciones rapidas
            </h3>
            <Button className="w-full" onClick={downloadQr}>
              <Download className="h-4 w-4" /> Descargar QR
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => selected && user && downloadReceiptPdf(selected, user)}
            >
              <Download className="h-4 w-4" /> Comprobante PDF
            </Button>
            <Button className="w-full" variant="ghost" asChild>
              <Link to={`/eventos/${event?.id_evento ?? ''}`}>
                <Info className="h-4 w-4" /> Detalles del evento
              </Link>
            </Button>
            <p className="text-center text-[10px] text-slate-400">
              {formatDate(event?.fecha_evento, 'dd/MM/yyyy')} · Pase #{selected?.id_inscripcion}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
