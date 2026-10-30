import type { Categoria, Evento } from '@/types';

export function eventDistances(event: Evento): number[] {
  const values = (event.categorias || []).map((categoria) => Number(categoria.distancia_km));
  return [...new Set(values.filter((value) => Number.isFinite(value) && value > 0))].sort(
    (a, b) => a - b,
  );
}

export function eventMinPrice(event: Evento): number | null {
  const prices = (event.categorias || [])
    .map((categoria) => Number(categoria.precio))
    .filter((value) => Number.isFinite(value));
  return prices.length ? Math.min(...prices) : null;
}

export function eventCapacity(event: Evento) {
  return (event.categorias || []).reduce(
    (acc, categoria) => {
      acc.total += Number(categoria.cupo_maximo || 0);
      acc.used += Number(categoria.cupos_ocupados || 0);
      acc.available += Number(categoria.cupos_disponibles ?? categoria.cupo_maximo ?? 0);
      return acc;
    },
    { total: 0, used: 0, available: 0 },
  );
}

export function eventOccupancy(event: Evento) {
  const { total, used } = eventCapacity(event);
  return total > 0 ? Math.round((used / total) * 100) : 0;
}

export function categoryDistanceLabel(categoria?: Categoria) {
  return categoria ? `${Number(categoria.distancia_km)}K` : '';
}

export function categoryEligibility(categoria?: Categoria) {
  if (!categoria) return '';
  const genero =
    categoria.genero === 'M'
      ? 'Varonil'
      : categoria.genero === 'F'
        ? 'Femenil'
        : 'Mixto';
  const edad =
    categoria.edad_minima !== null || categoria.edad_maxima !== null
      ? `${categoria.edad_minima ?? 0}-${categoria.edad_maxima ?? '+'} anos`
      : 'Todas las edades';
  return `${genero} · ${edad}`;
}
