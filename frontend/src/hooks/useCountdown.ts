import { useEffect, useMemo, useState } from 'react';

export interface CountdownValue {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  finished: boolean;
  totalMs: number;
}

function compute(target: string | Date): CountdownValue {
  const targetMs = new Date(target).getTime();
  const diff = Number.isFinite(targetMs) ? targetMs - Date.now() : 0;
  const total = Math.max(0, diff);
  return {
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total % 86_400_000) / 3_600_000),
    minutes: Math.floor((total % 3_600_000) / 60_000),
    seconds: Math.floor((total % 60_000) / 1000),
    finished: diff <= 0,
    totalMs: total,
  };
}

export function useCountdown(target?: string | Date | null) {
  const targetKey = target ? new Date(target).toISOString() : null;
  const [value, setValue] = useState<CountdownValue>(() =>
    compute(targetKey ?? new Date(0)),
  );

  useEffect(() => {
    if (!targetKey) return;
    setValue(compute(targetKey));
    const timer = window.setInterval(() => setValue(compute(targetKey)), 1000);
    return () => window.clearInterval(timer);
  }, [targetKey]);

  return useMemo(
    () => ({ ...value, valid: Boolean(targetKey) }),
    [value, targetKey],
  );
}
