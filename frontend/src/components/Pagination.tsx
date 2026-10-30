import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import type { PaginationMeta } from '@/types';

export function Pagination({
  meta,
  onPage,
  className,
}: {
  meta?: PaginationMeta;
  onPage: (page: number) => void;
  className?: string;
}) {
  if (!meta || meta.totalPages <= 1) return null;

  const pages = Array.from({ length: meta.totalPages }, (_, index) => index + 1)
    .filter(
      (page) =>
        page === 1 ||
        page === meta.totalPages ||
        Math.abs(page - meta.page) <= 1,
    )
    .reduce<(number | 'ellipsis')[]>((acc, page, index, list) => {
      if (index > 0 && page - Number(list[index - 1]) > 1) acc.push('ellipsis');
      acc.push(page);
      return acc;
    }, []);

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pagina <strong className="text-slate-900 dark:text-white">{meta.page}</strong> de{' '}
          {meta.totalPages} · {meta.total} registros
        </p>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPage(meta.page - 1)}
            disabled={!meta.hasPrev}
            aria-label="Pagina anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pages.map((page, index) =>
            page === 'ellipsis' ? (
              <span key={`ellipsis-${index}`} className="px-1 text-slate-400">
                …
              </span>
            ) : (
              <Button
                key={page}
                size="sm"
                variant={page === meta.page ? 'default' : 'outline'}
                className="min-w-9"
                onClick={() => onPage(page)}
              >
                {page}
              </Button>
            ),
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPage(meta.page + 1)}
            disabled={!meta.hasNext}
            aria-label="Pagina siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
