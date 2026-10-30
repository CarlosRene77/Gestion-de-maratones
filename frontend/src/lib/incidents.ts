import type { Incidencia, IncidenciaTipo } from '@/types';

const KEY = 'mh-incidencias';

function read(): Incidencia[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: Incidencia[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, 300)));
  } catch {
    // El modulo de incidencias es local; si el almacenamiento falla no bloquea.
  }
  window.dispatchEvent(new CustomEvent('mh:incidents-updated'));
}

export const TIPO_INCIDENCIA_LABEL: Record<IncidenciaTipo, string> = {
  cambio_talla: 'Cambio de talla',
  dorsal_extraviado: 'Dorsal extraviado',
  soporte_meta: 'Soporte en meta',
  otro: 'Otro',
};

export function listIncidents(idEvento?: number) {
  const items = read().sort(
    (a, b) => new Date(b.creada_en).getTime() - new Date(a.creada_en).getTime(),
  );
  return idEvento ? items.filter((item) => item.id_evento === idEvento) : items;
}

export function addIncident(payload: {
  id_evento: number;
  tipo: IncidenciaTipo;
  descripcion: string;
  id_inscripcion?: number | null;
  staff?: string;
}) {
  const incident: Incidencia = {
    id: `INC-${Date.now().toString(36).toUpperCase()}`,
    estado: 'abierta',
    creada_en: new Date().toISOString(),
    ...payload,
  };
  write([incident, ...read()]);
  return incident;
}

export function resolveIncident(id: string) {
  write(read().map((item) => (item.id === id ? { ...item, estado: 'resuelta' } : item)));
}

export function removeIncident(id: string) {
  write(read().filter((item) => item.id !== id));
}
