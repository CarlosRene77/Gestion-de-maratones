import { useId } from 'react';
import { Camera, RefreshCw, ScanLine } from 'lucide-react';
import { useQRScanner } from '@/hooks/useQRScanner';
import { Button } from './ui/button';

export function QRScannerPanel({
  active,
  onDecoded,
}: {
  active: boolean;
  onDecoded: (text: string) => void;
}) {
  const rawId = useId();
  const elementId = `qr-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`;
  const { error, scanning, retry } = useQRScanner({ elementId, active, onDecoded });

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-brand-500/30 bg-slate-950">
        <div id={elementId} className="mx-auto min-h-[280px] w-full [&_video]:rounded-xl" />
        {active && !error && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-56 w-56 max-w-[75%]">
              <span className="absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-2 border-t-2 border-brand-400" />
              <span className="absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-2 border-t-2 border-brand-400" />
              <span className="absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-2 border-l-2 border-brand-400" />
              <span className="absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-2 border-r-2 border-brand-400" />
              <span className="absolute left-2 right-2 top-1/2 h-0.5 animate-pulse-soft bg-brand-400/80 shadow-[0_0_18px_2px_rgba(34,197,94,.5)]" />
            </div>
          </div>
        )}
        {!active && (
          <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 text-slate-400">
            <Camera className="h-10 w-10" />
            <p className="max-w-xs text-center text-sm">
              Activa la camara para escanear el codigo QR del pase digital del corredor.
            </p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
          <p className="font-semibold">Camara no disponible</p>
          <p className="mt-1">{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={retry}>
            <RefreshCw className="h-3.5 w-3.5" /> Reintentar
          </Button>
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500 dark:text-slate-400">
        <ScanLine className="h-3.5 w-3.5" />
        {scanning ? 'Buscando codigo QR...' : 'Tambien puedes buscar por dorsal, nombre o email.'}
      </p>
    </div>
  );
}
