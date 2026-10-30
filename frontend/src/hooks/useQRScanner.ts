import { useCallback, useEffect, useRef, useState } from 'react';
import type { Html5Qrcode as Html5QrcodeType } from 'html5-qrcode';

export function useQRScanner({
  elementId,
  active,
  onDecoded,
}: {
  elementId: string;
  active: boolean;
  onDecoded: (text: string) => void;
}) {
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const decodedRef = useRef(onDecoded);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [attempt, setAttempt] = useState(0);

  decodedRef.current = onDecoded;

  const retry = useCallback(() => {
    setError(null);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!active) {
      setScanning(false);
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (cancelled) return;

        const scanner = new Html5Qrcode(elementId, { verbose: false });
        scannerRef.current = scanner;
        setScanning(true);

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 12, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
          (decodedText) => {
            decodedRef.current(decodedText);
            scanner
              .stop()
              .then(() => scanner.clear())
              .catch(() => undefined);
            scannerRef.current = null;
            setScanning(false);
          },
          () => {
            // Los fallos de lectura por frame son normales.
          },
        );
      } catch (cause) {
        if (cancelled) return;
        const message =
          cause instanceof Error
            ? cause.message
            : 'No se pudo iniciar la camara. Verifica los permisos del navegador.';
        setError(message);
        setScanning(false);
      }
    }

    start();

    return () => {
      cancelled = true;
      setScanning(false);
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => undefined);
      }
    };
  }, [active, elementId, attempt]);

  return { error, scanning, retry };
}
