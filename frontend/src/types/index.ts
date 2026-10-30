export type RolNombre = 'admin' | 'staff' | 'corredor';
export type EstadoEvento = 'borrador' | 'publicado' | 'en_curso' | 'finalizado';
export type EstadoPago = 'pendiente' | 'completado' | 'cancelado';
export type EstadoKit = 'pendiente' | 'entregado';
export type Genero = 'M' | 'F';
export type GeneroCategoria = 'M' | 'F' | 'Mixto';
export type Talla = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';

export interface Tema {
  modo_oscuro: boolean;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  tema?: Tema;
  meta?: PaginationMeta;
  error?: {
    code: string;
    details?: unknown;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ListResult<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface Rol {
  id_rol: number;
  nombre_rol: RolNombre;
}

export interface FichaMedica {
  tipo_sangre?: string;
  alergias?: string;
  condiciones?: string;
  medicamentos?: string;
  notas?: string;
}

export interface Usuario {
  id_usuario: number;
  id_rol: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  contacto_emergencia?: string | null;
  ficha_medica_json?: FichaMedica | null;
  modo_oscuro_pref?: boolean;
  estado_cuenta?: 'activo' | 'inactivo';
  fecha_nacimiento?: string | null;
  genero?: Genero | null;
  rol?: Rol;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthSession {
  token: string;
  token_type: string;
  expires_in: string;
  usuario: Usuario;
}

export interface Categoria {
  id_categoria: number;
  id_evento: number;
  nombre_cat: string;
  distancia_km: number;
  cupo_maximo: number;
  precio: number;
  edad_minima: number | null;
  edad_maxima: number | null;
  genero: GeneroCategoria;
  cupos_ocupados?: number;
  cupos_disponibles?: number;
  porcentaje_ocupacion?: number;
  evento?: EventoResumen;
}

export interface EventoResumen {
  id_evento: number;
  nombre_evento: string;
  fecha_evento: string;
  ciudad?: string | null;
  lugar_salida?: string | null;
  estado: EstadoEvento;
  imagen_banner?: string | null;
}

export interface Evento extends EventoResumen {
  descripcion?: string | null;
  categorias: Categoria[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Dorsal {
  id_dorsal: number;
  id_inscripcion: number;
  numero_dorsal: number;
  chip_code?: string | null;
  estado_kit: EstadoKit;
  tiempos?: TiempoCheckpoint[];
  inscripcion?: Inscripcion;
}

export interface TiempoCheckpoint {
  id_tiempo: number;
  nombre_punto: string;
  tiempo_marcado: string;
  id_dorsal?: number;
  id_staff_registro?: number | null;
  dorsal?: Dorsal;
  inscripcion?: Inscripcion;
}

export interface Inscripcion {
  id_inscripcion: number;
  id_usuario: number;
  id_categoria: number;
  codigo_transaccion?: string | null;
  estado_pago: EstadoPago;
  talla_camiseta?: string | null;
  fecha_inscripcion: string;
  categoria?: Categoria;
  usuario?: Usuario;
  dorsal?: Dorsal | null;
  numero_dorsal?: number | null;
  chip_code?: string | null;
  estado_kit?: EstadoKit;
  entregado_por?: number;
}

export interface Split {
  id_tiempo: number | null;
  nombre_punto: string;
  tiempo_marcado: string;
  desde_salida_segundos: number | null;
  desde_salida: string | null;
  parcial_segundos: number | null;
  parcial: string | null;
}

export interface ResultadoParticipante {
  posicion: number | null;
  id_inscripcion: number;
  numero_dorsal: number;
  chip_code?: string | null;
  corredor: {
    id_usuario: number;
    nombre: string;
    apellido: string;
    genero?: Genero | null;
  };
  categoria: {
    id_categoria: number;
    nombre_cat: string;
    distancia_km: number;
    genero: GeneroCategoria;
    edad_minima?: number | null;
    edad_maxima?: number | null;
  };
  finalizado: boolean;
  tiempo_neto_segundos: number | null;
  tiempo_neto: string | null;
  salida: string | null;
  meta: string | null;
  splits: Split[];
}

export interface ResultadosCategoria {
  id_categoria: number;
  nombre_cat: string;
  distancia_km: number;
  genero: GeneroCategoria;
  edad_minima?: number | null;
  edad_maxima?: number | null;
  inscritos: number;
  finalizados: number;
  resultados: ResultadoParticipante[];
}

export interface ResultadosEvento {
  evento: EventoResumen;
  filtros: {
    genero?: Genero | null;
    id_categoria?: number | null;
  };
  resumen: {
    categorias: number;
    inscritos: number;
    finalizados: number;
  };
  categorias: ResultadosCategoria[];
}

export interface ResultadoDorsal {
  numero_dorsal: number;
  chip_code?: string | null;
  corredor: {
    nombre: string;
    apellido: string;
    genero?: Genero | null;
  };
  categoria: {
    id_categoria: number;
    nombre_cat: string;
    distancia_km: number;
    genero: GeneroCategoria;
  };
  evento: {
    id_evento: number;
    nombre_evento: string;
    fecha_evento: string;
    ciudad?: string | null;
  };
  finalizado: boolean;
  tiempo_neto_segundos: number | null;
  tiempo_neto: string | null;
  salida: string | null;
  meta: string | null;
  total_marcaciones: number;
  splits: Split[];
}

export interface Certificado {
  codigo_verificacion: string;
  emitido_en: string;
  evento: {
    id_evento: number;
    nombre_evento: string;
    fecha_evento: string;
    ciudad?: string | null;
    lugar_salida?: string | null;
  };
  corredor: {
    nombre: string;
    apellido: string;
    genero?: Genero | null;
  };
  categoria: {
    id_categoria: number;
    nombre_cat: string;
    distancia_km: number;
    genero: GeneroCategoria;
  };
  numero_dorsal: number;
  chip_code?: string | null;
  posicion_categoria: number | null;
  posicion_genero: number | null;
  finalizados_categoria: number;
  tiempo_neto_segundos: number;
  tiempo_neto: string;
  salida: string;
  meta: string;
  splits: Split[];
  leyenda: string;
}

export interface CategoriaEstadistica {
  id_categoria: number;
  nombre_cat: string;
  cupo_maximo: number;
  precio: number;
  inscritos: number;
}

export interface EstadisticasEvento {
  id_evento: number;
  nombre_evento: string;
  estado: EstadoEvento;
  cupo_total: number;
  cupos_disponibles: number;
  inscripciones: Record<EstadoPago, number>;
  inscritos_activos: number;
  kits: Record<EstadoKit, number>;
  marcaciones_registradas: number;
  recaudado: number;
  generos: { M: number; F: number; sin_definir: number };
  tallas: Record<string, number>;
  categorias: CategoriaEstadistica[];
}

export interface MarcaTiempo {
  id_tiempo?: number;
  id_dorsal?: number;
  numero_dorsal?: number;
  nombre_punto: string;
  tiempo_marcado: string;
  id_staff_registro?: number | null;
  dorsal?: Dorsal;
  inscripcion?: Inscripcion;
}

export type IncidenciaTipo =
  | 'cambio_talla'
  | 'dorsal_extraviado'
  | 'soporte_meta'
  | 'otro';

export interface Incidencia {
  id: string;
  id_evento: number;
  id_inscripcion?: number | null;
  tipo: IncidenciaTipo;
  descripcion: string;
  estado: 'abierta' | 'resuelta';
  creada_en: string;
  staff?: string;
}
