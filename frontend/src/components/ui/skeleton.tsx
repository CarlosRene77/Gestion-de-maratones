import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function EventCardSkeleton() {
  return (
    <div className="surface overflow-hidden">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="surface overflow-hidden">
      <div className="flex items-center gap-4 border-b p-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="ml-auto h-9 w-28" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex items-center gap-4 p-4">
            {Array.from({ length: cols }).map((__, col) => (
              <Skeleton
                key={col}
                className={cn('h-4', col === 0 ? 'w-40' : 'w-24', col === cols - 1 && 'ml-auto')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="surface p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-8 w-32" />
            <Skeleton className="mt-3 h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="surface p-6 lg:col-span-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-6 h-64 w-full" />
        </div>
        <div className="surface p-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mx-auto mt-8 h-44 w-44 rounded-full" />
        </div>
      </div>
    </div>
  );
}
