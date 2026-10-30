import { Link } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({
  className,
  compact = false,
  to = '/',
}: {
  className?: string;
  compact?: boolean;
  to?: string;
}) {
  return (
    <Link to={to} className={cn('group flex items-center gap-2.5', className)}>
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-brand-500 text-slate-950 shadow-[0_8px_24px_-10px_rgba(34,197,94,.9)] transition-transform group-hover:-rotate-6">
        <Activity className="h-5 w-5" strokeWidth={2.8} />
        <span className="absolute -bottom-2 -right-2 h-4 w-4 rounded-full bg-electric-500" />
      </div>
      {!compact && (
        <span className="font-display text-xl font-extrabold uppercase leading-none tracking-tight text-slate-950 dark:text-white">
          Marathon<span className="text-brand-500">Hub</span>
        </span>
      )}
    </Link>
  );
}
