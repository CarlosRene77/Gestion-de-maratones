import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './ui/form';

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="pl-10 pr-9"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
          aria-label="Limpiar busqueda"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
