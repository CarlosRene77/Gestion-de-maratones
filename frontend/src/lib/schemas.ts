import { z } from 'zod';

const email = z.string().min(1, 'El email es obligatorio.').email('Ingresa un email valido.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'La contrasena es obligatoria.'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    nombre: z.string().min(2, 'Minimo 2 caracteres.').max(100, 'Maximo 100 caracteres.'),
    apellido: z.string().min(2, 'Minimo 2 caracteres.').max(100, 'Maximo 100 caracteres.'),
    email,
    password: z
      .string()
      .min(8, 'Minimo 8 caracteres.')
      .max(72, 'Maximo 72 caracteres.')
      .regex(/[A-Za-z]/, 'Incluye al menos una letra.')
      .regex(/\d/, 'Incluye al menos un numero.'),
    confirmar: z.string().min(1, 'Confirma tu contrasena.'),
    fecha_nacimiento: z
      .string()
      .min(1, 'La fecha de nacimiento es obligatoria.')
      .refine((value) => !Number.isNaN(new Date(value).getTime()), 'Fecha invalida.')
      .refine((value) => new Date(value) < new Date(), 'La fecha no puede ser futura.'),
    genero: z.enum(['M', 'F'], { required_error: 'Selecciona tu genero.' }),
    telefono: z.string().max(30, 'Maximo 30 caracteres.').optional().or(z.literal('')),
    contacto_emergencia: z
      .string()
      .max(150, 'Maximo 150 caracteres.')
      .optional()
      .or(z.literal('')),
  })
  .refine((values) => values.password === values.confirmar, {
    path: ['confirmar'],
    message: 'Las contrasenas no coinciden.',
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const profileSchema = z.object({
  nombre: z.string().min(2, 'Minimo 2 caracteres.').max(100),
  apellido: z.string().min(2, 'Minimo 2 caracteres.').max(100),
  telefono: z.string().max(30).optional().or(z.literal('')),
  contacto_emergencia: z.string().max(150).optional().or(z.literal('')),
  fecha_nacimiento: z.string().optional().or(z.literal('')),
  genero: z.enum(['M', 'F', '']).optional(),
  tipo_sangre: z.string().max(10).optional().or(z.literal('')),
  alergias: z.string().max(300).optional().or(z.literal('')),
  condiciones: z.string().max(300).optional().or(z.literal('')),
});
export type ProfileValues = z.infer<typeof profileSchema>;

export const passwordSchema = z
  .object({
    password_actual: z.string().min(1, 'Ingresa tu contrasena actual.'),
    password_nueva: z
      .string()
      .min(8, 'Minimo 8 caracteres.')
      .max(72, 'Maximo 72 caracteres.')
      .regex(/[A-Za-z]/, 'Incluye al menos una letra.')
      .regex(/\d/, 'Incluye al menos un numero.'),
    confirmar: z.string().min(1, 'Confirma la nueva contrasena.'),
  })
  .refine((values) => values.password_nueva === values.confirmar, {
    path: ['confirmar'],
    message: 'Las contrasenas no coinciden.',
  });
export type PasswordValues = z.infer<typeof passwordSchema>;

export const eventSchema = z.object({
  nombre_evento: z.string().min(3, 'Minimo 3 caracteres.').max(150, 'Maximo 150 caracteres.'),
  descripcion: z.string().max(5000, 'Maximo 5000 caracteres.').optional().or(z.literal('')),
  fecha_evento: z.string().min(1, 'La fecha es obligatoria.'),
  ciudad: z.string().max(100).optional().or(z.literal('')),
  lugar_salida: z.string().max(150).optional().or(z.literal('')),
  estado: z.enum(['borrador', 'publicado', 'en_curso', 'finalizado']),
  imagen_banner: z.string().max(500).optional().or(z.literal('')),
});
export type EventValues = z.infer<typeof eventSchema>;

export const categorySchema = z
  .object({
    nombre_cat: z.string().min(2, 'Minimo 2 caracteres.').max(120, 'Maximo 120 caracteres.'),
    distancia_km: z.coerce.number().gt(0, 'Debe ser mayor a 0.').max(1000),
    cupo_maximo: z.coerce.number().int('Entero requerido.').min(1, 'Minimo 1 cupo.'),
    precio: z.coerce.number().min(0, 'No puede ser negativo.'),
    genero: z.enum(['M', 'F', 'Mixto']),
    edad_minima: z.coerce.number().int().min(0).max(120).optional().or(z.literal('')),
    edad_maxima: z.coerce.number().int().min(0).max(120).optional().or(z.literal('')),
  })
  .refine(
    (values) =>
      values.edad_minima === '' ||
      values.edad_maxima === '' ||
      values.edad_minima === undefined ||
      values.edad_maxima === undefined ||
      Number(values.edad_minima) <= Number(values.edad_maxima),
    { path: ['edad_maxima'], message: 'Debe ser mayor o igual a la edad minima.' },
  );
export type CategoryValues = z.infer<typeof categorySchema>;

export const userSchema = z.object({
  nombre: z.string().min(2, 'Minimo 2 caracteres.').max(100),
  apellido: z.string().min(2, 'Minimo 2 caracteres.').max(100),
  email,
  password: z.string().optional().or(z.literal('')),
  rol: z.enum(['admin', 'staff', 'corredor']),
  telefono: z.string().max(30).optional().or(z.literal('')),
  genero: z.enum(['M', 'F', '']).optional(),
  fecha_nacimiento: z.string().optional().or(z.literal('')),
  estado_cuenta: z.enum(['activo', 'inactivo']),
});
export type UserValues = z.infer<typeof userSchema>;

export const incidentSchema = z.object({
  tipo: z.enum(['cambio_talla', 'dorsal_extraviado', 'soporte_meta', 'otro']),
  descripcion: z.string().min(5, 'Describe la incidencia (minimo 5 caracteres).').max(500),
  id_inscripcion: z.coerce.number().int().min(1).optional().or(z.literal('')),
});
export type IncidentValues = z.infer<typeof incidentSchema>;
