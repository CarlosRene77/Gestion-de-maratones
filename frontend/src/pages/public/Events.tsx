import { useEffect, useState } from 'react';
import { CalendarDays, SlidersHorizontal } from 'lucide-react';
import { useEvents } from '@/hooks/queries';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { EventCard } from '@/components/EventCard';
import { SearchInput } from '@/components/SearchInput';
import { PageHeader } from '@/components/ui/misc';
import { EventCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState, ErrorState } from '@/components/ui/misc';
import { Select } from '@/components/ui/form';
import { Pagination } from '@/components/Pagination';
import type { EstadoEvento } from '@/types';

const estadoOptions: { value: '' | EstadoEvento; label: string }[] = [
  { value: '', label: 'Todas las carreras' },
  { value: 'publicado', label: 'Inscripciones abiertas' },
  { value: 'en_curso', label: 'En curso' },
  { value: 'finalizado', label: 'Finalizadas' },
];

export function EventsPage() {
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState<'' | EstadoEvento>('');
  const [sort, setSort] = useState<'fecha_evento' | 'nombre_evento'>('fecha_evento');
  const [page, setPage] = useState(1);
  const q = useDebouncedValue(search, 350);

  useEffect(() => {
    setPage(1);
  }, [q, estado, sort]);

  const { data, isLoading, isError, refetch, isFetching } = useEvents({
    page,
    limit: 9,
    q: q || undefined,
    estado: estado || undefined,
    sort,
    order: sort === 'fecha_evento' ? 'asc' : 'asc',
  });

  const events = data?.items ?? [];

  return (
    <div className="container-page py-12 sm:py-16">
      <PageHeader
        eyebrow="Calendario deportivo"
        title="Carreras disponibles"
        description="Filtra por estado o busca por nombre y ciudad. Los cupos mostrados se actualizan en tiempo real."
      />

      <div className="mt-8 flex flex-col gap-3 rounded-2xl border bg-white p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900/60">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar carrera, ciudad o descripcion..."
          className="flex-1"
        />
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="hidden h-4 w-4 text-slate-400 sm:block" />
          <Select
            value={estado}
            onChange={(event) => setEstado(event.target.value as '' | EstadoEvento)}
            className="sm:w-52"
          >
            {estadoOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Select
            value={sort}
            onChange={(event) => setSort(event.target.value as 'fecha_evento' | 'nombre_evento')}
            className="sm:w-44"
          >
            <option value="fecha_evento">Por fecha</option>
            <option value="nombre_evento">Por nombre</option>
          </Select>
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <EventCardSkeleton key={index} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : events.length ? (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id_evento} event={event} />
              ))}
            </div>
            <Pagination meta={data?.meta} onPage={setPage} className="mt-8" />
          </>
        ) : (
          <EmptyState
            icon={CalendarDays}
            title="Sin carreras para mostrar"
            description="Prueba con otro termino de busqueda o cambia el filtro de estado."
          />
        )}
      </div>

      {isFetching && !isLoading && (
        <p className="mt-4 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Actualizando calendario...
        </p>
      )}
    </div>
  );
}
