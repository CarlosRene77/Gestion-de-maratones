import { cn } from '@/lib/utils';
import { useCountdown } from '@/hooks/useCountdown';

export function Countdown({
  target,
  className,
  compact = false,
  light = false,
}: {
  target?: string | Date | null;
  className?: string;
  compact?: boolean;
  light?: boolean;
}) {
  const value = useCountdown(target);

  if (!target) return null;
  if (value.finished) {
    return (
      <p
        className={cn(
          'text-sm font-semibold uppercase tracking-wider',
          light ? 'text-white/80' : 'text-slate-500 dark:text-slate-400',
          className,
        )}
      >
        La carrera ya comenzo
      </p>
    );
  }

  const items = [
    { value: value.days, label: 'Dias' },
    { value: value.hours, label: 'Horas' },
    { value: value.minutes, label: 'Min' },
    { value: value.seconds, label: 'Seg' },
  ];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {items.map((item, index) => (
        <div key={item.label} className="flex items-center gap-2">
          <div
            className={cn(
              'flex flex-col items-center rounded-xl border text-center',
              compact ? 'min-w-[46px] px-2 py-1.5' : 'min-w-[62px] px-3 py-2.5',
              light
                ? 'border-white/15 bg-white/10 backdrop-blur-md'
                : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900',
            )}
          >
            <span
              className={cn(
                'font-display font-extrabold tabular-nums leading-none',
                compact ? 'text-xl' : 'text-2xl',
                light ? 'text-white' : 'text-slate-950 dark:text-white',
              )}
            >
              {String(item.value).padStart(2, '0')}
            </span>
            <span
              className={cn(
                'mt-1 text-[9px] font-bold uppercase tracking-wider',
                light ? 'text-white/60' : 'text-slate-400',
              )}
            >
              {item.label}
            </span>
          </div>
          {index < items.length - 1 && (
            <span className={cn('text-lg font-bold', light ? 'text-white/30' : 'text-slate-300 dark:text-slate-700')}>
              :
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
