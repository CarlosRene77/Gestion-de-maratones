import type { Inscripcion } from '@/types';

export interface PassPayload {
  tipo: 'MH-PASS';
  v: 1;
  id_inscripcion: number;
  numero_dorsal: number | null;
  nonce: string;
  emitido: string;
}

export function makeNonce() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${random}-${Date.now().toString(36).toUpperCase()}`;
}

export function encodePass(
  inscripcion: Pick<Inscripcion, 'id_inscripcion' | 'numero_dorsal'>,
  nonce: string,
): string {
  const payload: PassPayload = {
    tipo: 'MH-PASS',
    v: 1,
    id_inscripcion: Number(inscripcion.id_inscripcion),
    numero_dorsal: inscripcion.numero_dorsal ? Number(inscripcion.numero_dorsal) : null,
    nonce,
    emitido: new Date().toISOString(),
  };
  return JSON.stringify(payload);
}

/**
 * Acepta el JSON dinamico del pase o un texto libre (por ejemplo un dorsal o un
 * codigo de chip) para que el escaner del staff pueda resolver ambos formatos.
 */
export function parsePass(text: string): PassPayload | null {
  const raw = String(text || '').trim();
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      parsed.tipo === 'MH-PASS' &&
      Number.isFinite(Number(parsed.id_inscripcion)) &&
      Number(parsed.id_inscripcion) > 0
    ) {
      return {
        tipo: 'MH-PASS',
        v: 1,
        id_inscripcion: Number(parsed.id_inscripcion),
        numero_dorsal: Number.isFinite(Number(parsed.numero_dorsal))
          ? Number(parsed.numero_dorsal)
          : null,
        nonce: String(parsed.nonce || ''),
        emitido: String(parsed.emitido || ''),
      };
    }
  } catch {
    // No es JSON: se intenta interpretar como dorsal o chip.
  }

  return null;
}

export function passBib(text: string): string | null {
  const payload = parsePass(text);
  if (payload?.numero_dorsal) return String(payload.numero_dorsal);
  const digits = String(text || '').match(/\d{2,8}/);
  return digits ? digits[0] : null;
}
