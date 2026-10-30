'use strict';

const META_PUNTO = 'META';
const SALIDA_PUNTO = 'SALIDA';

/**
 * Normaliza el nombre de un punto de control para evitar duplicados por
 * mayusculas/minusculas o espacios repetidos (ej. " km 5 " -> "KM 5").
 */
function normalizarPunto(nombre) {
  return String(nombre || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function calcularEdad(fechaNacimiento, referencia = new Date()) {
  if (!fechaNacimiento) return null;
  const nacimiento = new Date(fechaNacimiento);
  const ref = new Date(referencia);
  if (Number.isNaN(nacimiento.getTime()) || Number.isNaN(ref.getTime())) return null;

  let edad = ref.getUTCFullYear() - nacimiento.getUTCFullYear();
  const mes = ref.getUTCMonth() - nacimiento.getUTCMonth();
  if (mes < 0 || (mes === 0 && ref.getUTCDate() < nacimiento.getUTCDate())) {
    edad -= 1;
  }
  return edad;
}

function segundosEntre(inicio, fin) {
  if (!inicio || !fin) return null;
  const diff = Math.round((new Date(fin).getTime() - new Date(inicio).getTime()) / 1000);
  return Number.isFinite(diff) ? Math.max(0, diff) : null;
}

function formatearDuracion(segundos) {
  if (segundos === null || segundos === undefined) return null;
  const total = Math.max(0, Math.trunc(segundos));
  const h = String(Math.floor(total / 3600)).padStart(2, '0');
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Calcula tiempos netos y parciales a partir de las marcaciones de un dorsal.
 * La salida se toma del checkpoint "SALIDA"; si no existe, el tiempo neto
 * queda sin calcular para no producir resultados incorrectos.
 */
function calcularTiempos(tiempos = []) {
  const ordenados = [...tiempos]
    .filter((t) => t && t.tiempo_marcado)
    .sort((a, b) => new Date(a.tiempo_marcado) - new Date(b.tiempo_marcado));

  const salida = ordenados.find((t) => normalizarPunto(t.nombre_punto) === SALIDA_PUNTO);
  const meta = ordenados.find((t) => normalizarPunto(t.nombre_punto) === META_PUNTO);
  const base = salida ? new Date(salida.tiempo_marcado) : null;

  let anterior = null;
  const splits = ordenados.map((t) => {
    const fecha = new Date(t.tiempo_marcado);
    const desdeSalida = base ? segundosEntre(base, fecha) : null;
    const parcial = anterior ? segundosEntre(anterior, fecha) : null;
    anterior = fecha;

    return {
      id_tiempo: t.id_tiempo ?? null,
      nombre_punto: t.nombre_punto,
      tiempo_marcado: fecha.toISOString(),
      desde_salida_segundos: desdeSalida,
      desde_salida: formatearDuracion(desdeSalida),
      parcial_segundos: parcial,
      parcial: formatearDuracion(parcial)
    };
  });

  const netoSegundos = base && meta ? segundosEntre(base, meta.tiempo_marcado) : null;

  return {
    salida: salida ? new Date(salida.tiempo_marcado).toISOString() : null,
    meta: meta ? new Date(meta.tiempo_marcado).toISOString() : null,
    finalizado: Boolean(meta),
    tiempo_neto_segundos: netoSegundos,
    tiempo_neto: formatearDuracion(netoSegundos),
    splits
  };
}

module.exports = {
  META_PUNTO,
  SALIDA_PUNTO,
  normalizarPunto,
  calcularEdad,
  segundosEntre,
  formatearDuracion,
  calcularTiempos
};
