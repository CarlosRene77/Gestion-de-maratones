'use strict';

const env = require('../config/env');

const bearer = [{ bearerAuth: [] }];

const ref = (nombre) => ({ $ref: `#/components/schemas/${nombre}` });

const err = (description) => ({
  description,
  content: {
    'application/json': {
      schema: ref('ErrorResponse')
    }
  }
});

const comunes = {
  400: err('Solicitud invalida.'),
  401: err('No autenticado o token invalido/expirado.'),
  403: err('El rol del usuario no tiene permisos para la operacion.'),
  404: err('Recurso no encontrado.'),
  409: err('Conflicto de negocio (cupos, duplicados, estados, etc.).'),
  422: err('Datos de entrada invalidos.'),
  500: err('Error interno del servidor.')
};

const ok = (dataSchema, descripcion = 'Operacion exitosa.') => ({
  description: descripcion,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        required: ['success', 'message', 'data', 'tema'],
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: descripcion },
          data: dataSchema,
          tema: ref('Tema'),
          meta: ref('Paginacion')
        }
      }
    }
  }
});

const creado = (dataSchema, descripcion = 'Recurso creado correctamente.') => ok(dataSchema, descripcion);

const cuerpo = (schema, descripcion = 'Cuerpo de la peticion.') => ({
  required: true,
  description: descripcion,
  content: { 'application/json': { schema } }
});

const idPath = (nombre, descripcion) => ({
  name: nombre,
  in: 'path',
  required: true,
  description: descripcion,
  schema: { type: 'integer', minimum: 1 }
});

const paginacionParams = [
  { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 }, description: 'Pagina solicitada.' },
  { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 }, description: 'Registros por pagina.' }
];

const filtroGenero = {
  name: 'genero',
  in: 'query',
  schema: { type: 'string', enum: ['M', 'F'] },
  description: 'Filtra resultados por genero del corredor.'
};

const parametroComun = (name, tipo, descripcion, extra = {}) => ({
  name,
  in: 'query',
  schema: { type: tipo, ...extra },
  description: descripcion
});

const api = {
  openapi: '3.0.3',
  info: {
    title: 'MarathonHub API',
    version: '1.0.0',
    description: [
      'API REST para la gestion integral de carreras, maratones y eventos deportivos.',
      '',
      '**Caracteristicas principales**',
      '- Autenticacion JWT (24 horas) y RBAC con roles `admin`, `staff` y `corredor`.',
      '- Gestion de eventos, categorias, cupos, inscripciones, kits y dorsales.',
      '- Cronometraje en checkpoints y resultados en vivo con tiempos netos.',
      '- Certificados digitales de finalizacion.',
      '- Todas las respuestas incluyen `tema.modo_oscuro` para el frontend adaptativo.',
      '',
      '**Credenciales de prueba** (despues de `npm run seed:demo`)',
      '- Admin: `admin@marathonhub.com` / `Admin123!`',
      '- Staff: `staff@marathonhub.com` / `Staff123!`',
      '- Corredor: `corredor@marathonhub.com` / `Corredor123!`'
    ].join('\n')
  },
  servers: [
    { url: `http://localhost:${env.port}`, description: 'Servidor local' }
  ],
  tags: [
    { name: 'Sistema', description: 'Estado y metadatos del servicio.' },
    { name: 'Auth', description: 'Registro, autenticacion y perfil.' },
    { name: 'Usuarios', description: 'Administracion de usuarios y roles.' },
    { name: 'Eventos', description: 'Eventos deportivos y sus categorias.' },
    { name: 'Categorias', description: 'Categorias por distancia, edad y genero.' },
    { name: 'Inscripciones', description: 'Inscripciones, cupos y estado de pago.' },
    { name: 'Kits', description: 'Validacion y entrega de kits y dorsales.' },
    { name: 'Cronometraje', description: 'Marcaciones en checkpoints y resultados en vivo.' },
    { name: 'Resultados', description: 'Tabla de posiciones y certificados digitales.' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenido en `/api/auth/login`. Formato: `Bearer <token>`.'
      }
    },
    schemas: {
      Tema: {
        type: 'object',
        description: 'Preferencia visual del usuario para el frontend adaptativo (RNF-05).',
        properties: {
          modo_oscuro: { type: 'boolean', example: false }
        }
      },
      Paginacion: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 45 },
          totalPages: { type: 'integer', example: 3 },
          hasNext: { type: 'boolean', example: true },
          hasPrev: { type: 'boolean', example: false }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'La categoria no tiene cupos disponibles.' },
          data: { nullable: true, example: null },
          tema: ref('Tema'),
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'CONFLICT' },
              details: { nullable: true, example: { cupo_maximo: 100, cupos_ocupados: 100 } }
            }
          }
        }
      },
      Rol: {
        type: 'object',
        properties: {
          id_rol: { type: 'integer', example: 1 },
          nombre_rol: { type: 'string', enum: ['admin', 'staff', 'corredor'], example: 'admin' }
        }
      },
      Usuario: {
        type: 'object',
        properties: {
          id_usuario: { type: 'integer', example: 1 },
          id_rol: { type: 'integer', example: 1 },
          nombre: { type: 'string', example: 'Carlos' },
          apellido: { type: 'string', example: 'Runner' },
          email: { type: 'string', format: 'email', example: 'corredor@marathonhub.com' },
          telefono: { type: 'string', nullable: true, example: '+507 6000-0000' },
          contacto_emergencia: { type: 'string', nullable: true, example: 'Mama - 555-0100' },
          ficha_medica_json: {
            type: 'object',
            nullable: true,
            additionalProperties: true,
            example: { tipo_sangre: 'O+', alergias: ['penicilina'] }
          },
          modo_oscuro_pref: { type: 'boolean', example: true },
          estado_cuenta: { type: 'string', enum: ['activo', 'inactivo'], example: 'activo' },
          fecha_nacimiento: { type: 'string', format: 'date', nullable: true, example: '1993-03-15' },
          genero: { type: 'string', enum: ['M', 'F'], nullable: true, example: 'M' },
          rol: ref('Rol'),
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          token_type: { type: 'string', example: 'Bearer' },
          expires_in: { type: 'string', example: '24h' },
          usuario: ref('Usuario')
        }
      },
      Evento: {
        type: 'object',
        properties: {
          id_evento: { type: 'integer', example: 1 },
          nombre_evento: { type: 'string', example: 'Maraton de la Ciudad 2026' },
          descripcion: { type: 'string', nullable: true },
          fecha_evento: { type: 'string', format: 'date-time' },
          ciudad: { type: 'string', nullable: true, example: 'Ciudad de Panama' },
          lugar_salida: { type: 'string', nullable: true, example: 'Parque Omar' },
          estado: { type: 'string', enum: ['borrador', 'publicado', 'en_curso', 'finalizado'] },
          imagen_banner: { type: 'string', nullable: true },
          categorias: { type: 'array', items: ref('Categoria') },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      Categoria: {
        type: 'object',
        properties: {
          id_categoria: { type: 'integer', example: 1 },
          id_evento: { type: 'integer', example: 1 },
          nombre_cat: { type: 'string', example: '10K Libre' },
          distancia_km: { type: 'number', format: 'float', example: 10 },
          cupo_maximo: { type: 'integer', example: 200 },
          precio: { type: 'number', format: 'float', example: 25 },
          edad_minima: { type: 'integer', nullable: true, example: 18 },
          edad_maxima: { type: 'integer', nullable: true, example: 39 },
          genero: { type: 'string', enum: ['M', 'F', 'Mixto'], example: 'Mixto' },
          cupos_ocupados: { type: 'integer', example: 15 },
          cupos_disponibles: { type: 'integer', example: 185 },
          porcentaje_ocupacion: { type: 'number', example: 7.5 },
          evento: ref('Evento')
        }
      },
      Dorsal: {
        type: 'object',
        properties: {
          id_dorsal: { type: 'integer', example: 1 },
          id_inscripcion: { type: 'integer', example: 1 },
          numero_dorsal: { type: 'integer', example: 1001 },
          chip_code: { type: 'string', nullable: true, example: 'CHIP-1001' },
          estado_kit: { type: 'string', enum: ['pendiente', 'entregado'], example: 'entregado' }
        }
      },
      Inscripcion: {
        type: 'object',
        properties: {
          id_inscripcion: { type: 'integer', example: 1 },
          id_usuario: { type: 'integer', example: 3 },
          id_categoria: { type: 'integer', example: 1 },
          codigo_transaccion: { type: 'string', nullable: true, example: 'TX-2026-0001' },
          estado_pago: { type: 'string', enum: ['pendiente', 'completado', 'cancelado'] },
          talla_camiseta: { type: 'string', nullable: true, example: 'M' },
          fecha_inscripcion: { type: 'string', format: 'date-time' },
          numero_dorsal: { type: 'integer', nullable: true, example: 1001 },
          chip_code: { type: 'string', nullable: true, example: 'CHIP-1001' },
          estado_kit: { type: 'string', enum: ['pendiente', 'entregado'], example: 'pendiente' },
          usuario: ref('Usuario'),
          categoria: ref('Categoria'),
          dorsal: {
            nullable: true,
            allOf: [ref('Dorsal')]
          }
        }
      },
      TiempoCheckpoint: {
        type: 'object',
        properties: {
          id_tiempo: { type: 'integer', example: 12 },
          id_dorsal: { type: 'integer', example: 1 },
          numero_dorsal: { type: 'integer', example: 1001 },
          nombre_punto: { type: 'string', example: 'KM 5' },
          tiempo_marcado: { type: 'string', format: 'date-time' },
          id_staff_registro: { type: 'integer', nullable: true, example: 2 }
        }
      },
      Split: {
        type: 'object',
        properties: {
          id_tiempo: { type: 'integer', nullable: true },
          nombre_punto: { type: 'string', example: 'KM 5' },
          tiempo_marcado: { type: 'string', format: 'date-time' },
          desde_salida_segundos: { type: 'integer', nullable: true, example: 1500 },
          desde_salida: { type: 'string', nullable: true, example: '00:25:00' },
          parcial_segundos: { type: 'integer', nullable: true, example: 1500 },
          parcial: { type: 'string', nullable: true, example: '00:25:00' }
        }
      },
      CalculoTiempos: {
        type: 'object',
        properties: {
          salida: { type: 'string', format: 'date-time', nullable: true },
          meta: { type: 'string', format: 'date-time', nullable: true },
          finalizado: { type: 'boolean', example: true },
          tiempo_neto_segundos: { type: 'integer', nullable: true, example: 3120 },
          tiempo_neto: { type: 'string', nullable: true, example: '00:52:00' },
          splits: { type: 'array', items: ref('Split') }
        }
      },
      Marcacion: {
        allOf: [
          ref('TiempoCheckpoint'),
          {
            type: 'object',
            properties: {
              id_dorsal: { type: 'integer' },
              corredor: {
                type: 'object',
                properties: {
                  id_usuario: { type: 'integer' },
                  nombre: { type: 'string' },
                  apellido: { type: 'string' },
                  genero: { type: 'string', nullable: true }
                }
              },
              categoria: ref('Categoria'),
              evento: ref('Evento'),
              calculo: ref('CalculoTiempos')
            }
          }
        ]
      },
      ParticipanteResultado: {
        type: 'object',
        properties: {
          posicion: { type: 'integer', nullable: true, example: 1 },
          id_inscripcion: { type: 'integer' },
          numero_dorsal: { type: 'integer', example: 1001 },
          chip_code: { type: 'string', nullable: true },
          corredor: {
            type: 'object',
            properties: {
              id_usuario: { type: 'integer' },
              nombre: { type: 'string', example: 'Luis' },
              apellido: { type: 'string', example: 'Gomez' },
              genero: { type: 'string', nullable: true, example: 'M' }
            }
          },
          categoria: ref('Categoria'),
          finalizado: { type: 'boolean', example: true },
          tiempo_neto_segundos: { type: 'integer', nullable: true, example: 2820 },
          tiempo_neto: { type: 'string', nullable: true, example: '00:47:00' },
          salida: { type: 'string', format: 'date-time', nullable: true },
          meta: { type: 'string', format: 'date-time', nullable: true },
          splits: { type: 'array', items: ref('Split') }
        }
      },
      ResultadoCategoria: {
        type: 'object',
        properties: {
          id_categoria: { type: 'integer' },
          nombre_cat: { type: 'string' },
          distancia_km: { type: 'number' },
          genero: { type: 'string' },
          edad_minima: { type: 'integer', nullable: true },
          edad_maxima: { type: 'integer', nullable: true },
          inscritos: { type: 'integer', example: 25 },
          finalizados: { type: 'integer', example: 23 },
          resultados: { type: 'array', items: ref('ParticipanteResultado') }
        }
      },
      Certificado: {
        type: 'object',
        properties: {
          codigo_verificacion: { type: 'string', example: 'A1B2C3D4E5F60708' },
          emitido_en: { type: 'string', format: 'date-time' },
          evento: ref('Evento'),
          corredor: {
            type: 'object',
            properties: {
              nombre: { type: 'string' },
              apellido: { type: 'string' },
              genero: { type: 'string', nullable: true }
            }
          },
          categoria: ref('Categoria'),
          numero_dorsal: { type: 'integer' },
          chip_code: { type: 'string', nullable: true },
          posicion_categoria: { type: 'integer', nullable: true },
          posicion_genero: { type: 'integer', nullable: true },
          finalizados_categoria: { type: 'integer' },
          tiempo_neto_segundos: { type: 'integer' },
          tiempo_neto: { type: 'string', example: '00:52:00' },
          salida: { type: 'string', format: 'date-time' },
          meta: { type: 'string', format: 'date-time' },
          splits: { type: 'array', items: ref('Split') },
          leyenda: { type: 'string' }
        }
      },
      EstadisticasEvento: {
        type: 'object',
        properties: {
          id_evento: { type: 'integer' },
          nombre_evento: { type: 'string' },
          estado: { type: 'string' },
          cupo_total: { type: 'integer', example: 500 },
          cupos_disponibles: { type: 'integer', example: 400 },
          inscripciones: {
            type: 'object',
            properties: {
              pendiente: { type: 'integer' },
              completado: { type: 'integer' },
              cancelado: { type: 'integer' }
            }
          },
          inscritos_activos: { type: 'integer' },
          kits: {
            type: 'object',
            properties: {
              pendiente: { type: 'integer' },
              entregado: { type: 'integer' }
            }
          },
          marcaciones_registradas: { type: 'integer' },
          recaudado: { type: 'number', example: 2500 },
          generos: {
            type: 'object',
            properties: {
              M: { type: 'integer' },
              F: { type: 'integer' },
              sin_definir: { type: 'integer' }
            }
          },
          tallas: {
            type: 'object',
            properties: {
              S: { type: 'integer' },
              M: { type: 'integer' },
              L: { type: 'integer' },
              XL: { type: 'integer' },
              XXL: { type: 'integer' },
              sin_talla: { type: 'integer' }
            }
          },
          categorias: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id_categoria: { type: 'integer' },
                nombre_cat: { type: 'string' },
                cupo_maximo: { type: 'integer' },
                precio: { type: 'number' },
                inscritos: { type: 'integer' }
              }
            }
          }
        }
      },
      RegistroRequest: {
        type: 'object',
        required: ['nombre', 'apellido', 'email', 'password'],
        properties: {
          nombre: { type: 'string', example: 'Carlos' },
          apellido: { type: 'string', example: 'Runner' },
          email: { type: 'string', format: 'email', example: 'corredor@marathonhub.com' },
          password: { type: 'string', format: 'password', minLength: 8, maxLength: 72, example: 'Corredor123!' },
          telefono: { type: 'string', nullable: true, example: '+507 6000-0000' },
          contacto_emergencia: { type: 'string', nullable: true, example: 'Mama - 555-0100' },
          ficha_medica_json: { type: 'object', nullable: true, additionalProperties: true },
          modo_oscuro_pref: { type: 'boolean', example: false },
          fecha_nacimiento: { type: 'string', format: 'date', nullable: true, example: '1993-03-15' },
          genero: { type: 'string', enum: ['M', 'F'], nullable: true, example: 'M' }
        }
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'admin@marathonhub.com' },
          password: { type: 'string', format: 'password', example: 'Admin123!' }
        }
      },
      PerfilUpdateRequest: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          telefono: { type: 'string', nullable: true },
          contacto_emergencia: { type: 'string', nullable: true },
          ficha_medica_json: { type: 'object', nullable: true, additionalProperties: true },
          modo_oscuro_pref: { type: 'boolean' },
          fecha_nacimiento: { type: 'string', format: 'date', nullable: true },
          genero: { type: 'string', enum: ['M', 'F'], nullable: true }
        }
      },
      PasswordChangeRequest: {
        type: 'object',
        required: ['password_actual', 'password_nueva'],
        properties: {
          password_actual: { type: 'string', format: 'password' },
          password_nueva: { type: 'string', format: 'password', minLength: 8, maxLength: 72 }
        }
      },
      PasswordResetRequest: {
        type: 'object',
        required: ['password_nueva'],
        properties: {
          password_nueva: { type: 'string', format: 'password', minLength: 8, maxLength: 72 }
        }
      },
      TemaRequest: {
        type: 'object',
        required: ['modo_oscuro_pref'],
        properties: {
          modo_oscuro_pref: { type: 'boolean', example: true }
        }
      },
      UsuarioRequest: {
        type: 'object',
        required: ['nombre', 'apellido', 'email', 'password', 'rol'],
        properties: {
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', format: 'password', minLength: 8, maxLength: 72 },
          rol: { type: 'string', enum: ['admin', 'staff', 'corredor'] },
          telefono: { type: 'string', nullable: true },
          contacto_emergencia: { type: 'string', nullable: true },
          ficha_medica_json: { type: 'object', nullable: true, additionalProperties: true },
          modo_oscuro_pref: { type: 'boolean' },
          estado_cuenta: { type: 'string', enum: ['activo', 'inactivo'] },
          fecha_nacimiento: { type: 'string', format: 'date', nullable: true },
          genero: { type: 'string', enum: ['M', 'F'], nullable: true }
        }
      },
      UsuarioUpdateRequest: {
        type: 'object',
        properties: {
          nombre: { type: 'string' },
          apellido: { type: 'string' },
          email: { type: 'string', format: 'email' },
          rol: { type: 'string', enum: ['admin', 'staff', 'corredor'] },
          telefono: { type: 'string', nullable: true },
          contacto_emergencia: { type: 'string', nullable: true },
          ficha_medica_json: { type: 'object', nullable: true, additionalProperties: true },
          modo_oscuro_pref: { type: 'boolean' },
          estado_cuenta: { type: 'string', enum: ['activo', 'inactivo'] },
          fecha_nacimiento: { type: 'string', format: 'date', nullable: true },
          genero: { type: 'string', enum: ['M', 'F'], nullable: true }
        }
      },
      EventoRequest: {
        type: 'object',
        required: ['nombre_evento', 'fecha_evento'],
        properties: {
          nombre_evento: { type: 'string', example: 'Media Maraton 2026' },
          descripcion: { type: 'string', nullable: true },
          fecha_evento: { type: 'string', format: 'date-time', example: '2026-11-15T06:00:00.000Z' },
          ciudad: { type: 'string', nullable: true, example: 'Ciudad de Panama' },
          lugar_salida: { type: 'string', nullable: true, example: 'Cinta Costera' },
          estado: { type: 'string', enum: ['borrador', 'publicado', 'en_curso', 'finalizado'], example: 'publicado' },
          imagen_banner: { type: 'string', nullable: true, example: 'https://cdn.example.com/banner.jpg' }
        }
      },
      CategoriaRequest: {
        type: 'object',
        required: ['nombre_cat', 'distancia_km', 'cupo_maximo', 'precio', 'genero'],
        properties: {
          nombre_cat: { type: 'string', example: '21K Master' },
          distancia_km: { type: 'number', example: 21.1 },
          cupo_maximo: { type: 'integer', example: 150 },
          precio: { type: 'number', example: 40 },
          edad_minima: { type: 'integer', nullable: true, example: 40 },
          edad_maxima: { type: 'integer', nullable: true, example: 99 },
          genero: { type: 'string', enum: ['M', 'F', 'Mixto'], example: 'Mixto' }
        }
      },
      InscripcionRequest: {
        type: 'object',
        required: ['id_categoria'],
        properties: {
          id_categoria: { type: 'integer', example: 1 },
          talla_camiseta: { type: 'string', nullable: true, example: 'M' },
          codigo_transaccion: { type: 'string', nullable: true, example: 'TX-2026-0001' },
          id_usuario: { type: 'integer', description: 'Solo admin: inscribe a otro usuario.', example: 5 },
          estado_pago: {
            type: 'string',
            enum: ['pendiente', 'completado', 'cancelado'],
            description: 'Solo admin.',
            example: 'pendiente'
          }
        }
      },
      PagoRequest: {
        type: 'object',
        required: ['estado_pago'],
        properties: {
          estado_pago: { type: 'string', enum: ['pendiente', 'completado', 'cancelado'] }
        }
      },
      KitEntregaRequest: {
        type: 'object',
        required: ['id_inscripcion'],
        properties: {
          id_inscripcion: { type: 'integer', example: 1 },
          numero_dorsal: { type: 'integer', description: 'Si se omite, se asigna automaticamente.', example: 1001 },
          chip_code: { type: 'string', nullable: true, example: 'CHIP-1001' }
        }
      },
      MarcacionRequest: {
        type: 'object',
        required: ['nombre_punto'],
        properties: {
          id_dorsal: { type: 'integer', description: 'Requerido si no se envia numero_dorsal.' },
          numero_dorsal: { type: 'integer', description: 'Requerido si no se envia id_dorsal.', example: 1001 },
          nombre_punto: { type: 'string', example: 'KM 5' },
          tiempo_marcado: { type: 'string', format: 'date-time', nullable: true, example: '2026-10-30T06:25:00.000Z' },
          id_evento: { type: 'integer', nullable: true, description: 'Valida que el dorsal pertenezca al evento.' }
        }
      },
      MarcacionUpdateRequest: {
        type: 'object',
        properties: {
          nombre_punto: { type: 'string', example: 'KM 10' },
          tiempo_marcado: { type: 'string', format: 'date-time' }
        }
      }
    }
  },
  paths: {
    '/': {
      get: {
        tags: ['Sistema'],
        summary: 'Informacion general de la API',
        security: [],
        responses: {
          200: ok({
            type: 'object',
            properties: {
              nombre: { type: 'string' },
              version: { type: 'string' },
              documentacion: { type: 'string' },
              endpoints: { type: 'object', additionalProperties: { type: 'string' } }
            }
          })
        }
      }
    },
    '/health': {
      get: {
        tags: ['Sistema'],
        summary: 'Estado del servicio y de la base de datos',
        security: [],
        responses: {
          200: ok({
            type: 'object',
            properties: {
              estado: { type: 'string', example: 'ok' },
              uptime_segundos: { type: 'integer' },
              entorno: { type: 'string' },
              base_datos: { type: 'string', example: 'conectada' },
              timestamp: { type: 'string', format: 'date-time' }
            }
          }),
          503: err('Base de datos no disponible.')
        }
      }
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registro publico de corredor',
        description: 'Crea una cuenta con rol `corredor`, cifra la contrasena con Bcrypt y devuelve un JWT.',
        security: [],
        requestBody: cuerpo(ref('RegistroRequest')),
        responses: {
          201: creado(ref('AuthResponse'), 'Corredor registrado correctamente.'),
          409: err('El email ya esta registrado.'),
          ...comunes
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Inicio de sesion con JWT',
        description: 'Autenticacion universal. Devuelve el token, el rol y la preferencia de tema del usuario.',
        security: [],
        requestBody: cuerpo(ref('LoginRequest')),
        responses: {
          200: ok(ref('AuthResponse'), 'Inicio de sesion exitoso.'),
          401: err('Credenciales invalidas.'),
          403: err('Cuenta inactiva.'),
          ...comunes
        }
      }
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Perfil del usuario autenticado',
        security: bearer,
        responses: {
          200: ok(ref('Usuario')),
          ...comunes
        }
      },
      put: {
        tags: ['Auth'],
        summary: 'Actualizar el propio perfil',
        description: 'Incluye datos medicos, contacto de emergencia, fecha de nacimiento, genero y tema.',
        security: bearer,
        requestBody: cuerpo(ref('PerfilUpdateRequest')),
        responses: {
          200: ok(ref('Usuario'), 'Perfil actualizado correctamente.'),
          ...comunes
        }
      }
    },
    '/api/auth/password': {
      put: {
        tags: ['Auth'],
        summary: 'Cambiar la propia contrasena',
        security: bearer,
        requestBody: cuerpo(ref('PasswordChangeRequest')),
        responses: {
          200: ok({
            type: 'object',
            properties: { id_usuario: { type: 'integer' } }
          }, 'Contrasena actualizada correctamente.'),
          ...comunes
        }
      }
    },
    '/api/auth/preferencias': {
      put: {
        tags: ['Auth'],
        summary: 'Actualizar preferencia de modo oscuro',
        description: 'Persiste la preferencia visual que la API devuelve en el campo `tema` de cada respuesta.',
        security: bearer,
        requestBody: cuerpo(ref('TemaRequest')),
        responses: {
          200: ok({
            type: 'object',
            properties: { modo_oscuro_pref: { type: 'boolean' } }
          }, 'Preferencia de tema actualizada.'),
          ...comunes
        }
      }
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Cerrar sesion (cliente)',
        description: 'El backend es stateless: el cliente debe eliminar el token. Se responde con confirmacion.',
        security: bearer,
        responses: {
          200: ok({ nullable: true, example: null }, 'Sesion finalizada.'),
          ...comunes
        }
      }
    },
    '/api/usuarios': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar usuarios',
        security: bearer,
        parameters: [
          ...paginacionParams,
          parametroComun('rol', 'string', 'Filtra por rol.', { enum: ['admin', 'staff', 'corredor'] }),
          parametroComun('estado_cuenta', 'string', 'Filtra por estado.', { enum: ['activo', 'inactivo'] }),
          parametroComun('q', 'string', 'Busca por nombre, apellido o email.')
        ],
        responses: {
          200: ok({ type: 'array', items: ref('Usuario') }, 'Usuarios obtenidos correctamente.'),
          ...comunes
        }
      },
      post: {
        tags: ['Usuarios'],
        summary: 'Crear usuario con cualquier rol',
        security: bearer,
        requestBody: cuerpo(ref('UsuarioRequest')),
        responses: {
          201: creado(ref('Usuario'), 'Usuario creado correctamente.'),
          ...comunes
        }
      }
    },
    '/api/usuarios/{id}': {
      get: {
        tags: ['Usuarios'],
        summary: 'Obtener usuario por id',
        security: bearer,
        parameters: [idPath('id', 'Id del usuario.')],
        responses: {
          200: ok(ref('Usuario')),
          ...comunes
        }
      },
      put: {
        tags: ['Usuarios'],
        summary: 'Actualizar usuario',
        security: bearer,
        parameters: [idPath('id', 'Id del usuario.')],
        requestBody: cuerpo(ref('UsuarioUpdateRequest')),
        responses: {
          200: ok(ref('Usuario'), 'Usuario actualizado correctamente.'),
          ...comunes
        }
      },
      delete: {
        tags: ['Usuarios'],
        summary: 'Desactivar usuario (borrado logico)',
        security: bearer,
        parameters: [idPath('id', 'Id del usuario.')],
        responses: {
          200: ok({
            type: 'object',
            properties: {
              id_usuario: { type: 'integer' },
              estado_cuenta: { type: 'string', example: 'inactivo' }
            }
          }, 'Usuario desactivado correctamente.'),
          ...comunes
        }
      }
    },
    '/api/usuarios/{id}/estado': {
      patch: {
        tags: ['Usuarios'],
        summary: 'Activar o desactivar una cuenta',
        security: bearer,
        parameters: [idPath('id', 'Id del usuario.')],
        requestBody: cuerpo({
          type: 'object',
          required: ['estado_cuenta'],
          properties: {
            estado_cuenta: { type: 'string', enum: ['activo', 'inactivo'] }
          }
        }),
        responses: {
          200: ok({
            type: 'object',
            properties: {
              id_usuario: { type: 'integer' },
              estado_cuenta: { type: 'string' }
            }
          }, 'Estado de cuenta actualizado.'),
          ...comunes
        }
      }
    },
    '/api/usuarios/{id}/password': {
      put: {
        tags: ['Usuarios'],
        summary: 'Restablecer contrasena de un usuario (admin)',
        security: bearer,
        parameters: [idPath('id', 'Id del usuario.')],
        requestBody: cuerpo(ref('PasswordResetRequest')),
        responses: {
          200: ok({
            type: 'object',
            properties: { id_usuario: { type: 'integer' } }
          }, 'Contrasena restablecida correctamente.'),
          ...comunes
        }
      }
    },
    '/api/roles': {
      get: {
        tags: ['Usuarios'],
        summary: 'Listar roles disponibles',
        security: bearer,
        responses: {
          200: ok({ type: 'array', items: ref('Rol') }),
          ...comunes
        }
      }
    },
    '/api/eventos': {
      get: {
        tags: ['Eventos'],
        summary: 'Listar eventos',
        description: 'Los eventos en borrador solo son visibles para admin/staff autenticados.',
        security: [],
        parameters: [
          ...paginacionParams,
          parametroComun('estado', 'string', 'Filtra por estado.', { enum: ['borrador', 'publicado', 'en_curso', 'finalizado'] }),
          parametroComun('ciudad', 'string', 'Filtra por ciudad.'),
          parametroComun('q', 'string', 'Busca por nombre, descripcion o ciudad.'),
          parametroComun('desde', 'string', 'Fecha minima (ISO 8601).', { format: 'date-time' }),
          parametroComun('hasta', 'string', 'Fecha maxima (ISO 8601).', { format: 'date-time' }),
          parametroComun('sort', 'string', 'Campo de orden.', { enum: ['fecha_evento', 'nombre_evento', 'created_at'] }),
          parametroComun('order', 'string', 'Direccion del orden.', { enum: ['asc', 'desc'] })
        ],
        responses: {
          200: ok({ type: 'array', items: ref('Evento') }, 'Eventos obtenidos correctamente.'),
          ...comunes
        }
      },
      post: {
        tags: ['Eventos'],
        summary: 'Crear evento',
        description: 'Solo admin/organizador.',
        security: bearer,
        requestBody: cuerpo(ref('EventoRequest')),
        responses: {
          201: creado(ref('Evento'), 'Evento creado correctamente.'),
          ...comunes
        }
      }
    },
    '/api/eventos/{id}': {
      get: {
        tags: ['Eventos'],
        summary: 'Obtener evento con categorias y cupos',
        security: [],
        parameters: [idPath('id', 'Id del evento.')],
        responses: {
          200: ok(ref('Evento')),
          ...comunes
        }
      },
      put: {
        tags: ['Eventos'],
        summary: 'Actualizar evento',
        security: bearer,
        parameters: [idPath('id', 'Id del evento.')],
        requestBody: cuerpo(ref('EventoRequest')),
        responses: {
          200: ok(ref('Evento'), 'Evento actualizado correctamente.'),
          ...comunes
        }
      },
      delete: {
        tags: ['Eventos'],
        summary: 'Eliminar evento sin inscripciones',
        security: bearer,
        parameters: [idPath('id', 'Id del evento.')],
        responses: {
          200: ok({
            type: 'object',
            properties: { id_evento: { type: 'integer' } }
          }, 'Evento eliminado correctamente.'),
          ...comunes
        }
      }
    },
    '/api/eventos/{id}/estado': {
      patch: {
        tags: ['Eventos'],
        summary: 'Cambiar estado del evento',
        description: 'Flujo recomendado: borrador -> publicado -> en_curso -> finalizado.',
        security: bearer,
        parameters: [idPath('id', 'Id del evento.')],
        requestBody: cuerpo({
          type: 'object',
          required: ['estado'],
          properties: {
            estado: { type: 'string', enum: ['borrador', 'publicado', 'en_curso', 'finalizado'] }
          }
        }),
        responses: {
          200: ok({
            type: 'object',
            properties: {
              id_evento: { type: 'integer' },
              estado: { type: 'string' }
            }
          }, 'Estado del evento actualizado.'),
          ...comunes
        }
      }
    },
    '/api/eventos/{id}/estadisticas': {
      get: {
        tags: ['Eventos'],
        summary: 'Estadisticas de cupos, pagos, kits y recaudacion',
        security: bearer,
        parameters: [idPath('id', 'Id del evento.')],
        responses: {
          200: ok(ref('EstadisticasEvento')),
          ...comunes
        }
      }
    },
    '/api/eventos/{idEvento}/categorias': {
      get: {
        tags: ['Eventos'],
        summary: 'Listar categorias de un evento',
        security: [],
        parameters: [idPath('idEvento', 'Id del evento.')],
        responses: {
          200: ok({ type: 'array', items: ref('Categoria') }),
          ...comunes
        }
      },
      post: {
        tags: ['Eventos'],
        summary: 'Crear categoria en un evento',
        security: bearer,
        parameters: [idPath('idEvento', 'Id del evento.')],
        requestBody: cuerpo(ref('CategoriaRequest')),
        responses: {
          201: creado(ref('Categoria'), 'Categoria creada correctamente.'),
          ...comunes
        }
      }
    },
    '/api/categorias/{id}': {
      get: {
        tags: ['Categorias'],
        summary: 'Obtener categoria con cupos disponibles',
        security: [],
        parameters: [idPath('id', 'Id de la categoria.')],
        responses: {
          200: ok(ref('Categoria')),
          ...comunes
        }
      },
      put: {
        tags: ['Categorias'],
        summary: 'Actualizar categoria',
        description: 'No permite reducir el cupo por debajo de las inscripciones existentes.',
        security: bearer,
        parameters: [idPath('id', 'Id de la categoria.')],
        requestBody: cuerpo(ref('CategoriaRequest')),
        responses: {
          200: ok(ref('Categoria'), 'Categoria actualizada correctamente.'),
          ...comunes
        }
      },
      delete: {
        tags: ['Categorias'],
        summary: 'Eliminar categoria sin inscripciones',
        security: bearer,
        parameters: [idPath('id', 'Id de la categoria.')],
        responses: {
          200: ok({
            type: 'object',
            properties: { id_categoria: { type: 'integer' } }
          }, 'Categoria eliminada correctamente.'),
          ...comunes
        }
      }
    },
    '/api/inscripciones': {
      get: {
        tags: ['Inscripciones'],
        summary: 'Listar inscripciones',
        description: 'El corredor solo ve sus propias inscripciones; el admin ve todas.',
        security: bearer,
        parameters: [
          ...paginacionParams,
          parametroComun('id_evento', 'integer', 'Filtra por evento.'),
          parametroComun('id_categoria', 'integer', 'Filtra por categoria.'),
          parametroComun('id_usuario', 'integer', 'Filtra por usuario (admin).'),
          parametroComun('estado_pago', 'string', 'Filtra por estado de pago.', { enum: ['pendiente', 'completado', 'cancelado'] }),
          parametroComun('q', 'string', 'Busca por nombre, email, dorsal o chip.')
        ],
        responses: {
          200: ok({ type: 'array', items: ref('Inscripcion') }, 'Inscripciones obtenidas correctamente.'),
          ...comunes
        }
      },
      post: {
        tags: ['Inscripciones'],
        summary: 'Inscribirse a una categoria',
        description: 'Valida cupos, edad, genero, pago y duplicados dentro de una transaccion ACID.',
        security: bearer,
        requestBody: cuerpo(ref('InscripcionRequest')),
        responses: {
          201: creado(ref('Inscripcion'), 'Inscripcion registrada correctamente.'),
          409: err('Sin cupos, evento no publicado o inscripcion duplicada.'),
          ...comunes
        }
      }
    },
    '/api/inscripciones/{id}': {
      get: {
        tags: ['Inscripciones'],
        summary: 'Obtener inscripcion con dorsal y tiempos',
        security: bearer,
        parameters: [idPath('id', 'Id de la inscripcion.')],
        responses: {
          200: ok(ref('Inscripcion')),
          ...comunes
        }
      },
      delete: {
        tags: ['Inscripciones'],
        summary: 'Cancelar inscripcion',
        description: 'El corredor solo puede cancelar sus propias inscripciones. Libera el cupo.',
        security: bearer,
        parameters: [idPath('id', 'Id de la inscripcion.')],
        responses: {
          200: ok(ref('Inscripcion'), 'Inscripcion cancelada correctamente.'),
          ...comunes
        }
      }
    },
    '/api/inscripciones/{id}/pago': {
      patch: {
        tags: ['Inscripciones'],
        summary: 'Actualizar estado de pago (admin)',
        security: bearer,
        parameters: [idPath('id', 'Id de la inscripcion.')],
        requestBody: cuerpo(ref('PagoRequest')),
        responses: {
          200: ok(ref('Inscripcion'), 'Estado de pago actualizado correctamente.'),
          ...comunes
        }
      }
    },
    '/api/inscripciones/{id}/pago-simulado': {
      post: {
        tags: ['Inscripciones'],
        summary: 'Completar pago simulado del corredor',
        description: 'Simula la pasarela de pago para el propietario de la inscripcion. No reemplaza una pasarela real.',
        security: bearer,
        parameters: [idPath('id', 'Id de la inscripcion.')],
        requestBody: cuerpo({
          type: 'object',
          properties: {
            metodo_pago: { type: 'string', enum: ['tarjeta_simulada', 'comprobante'] },
            codigo_transaccion: { type: 'string', nullable: true },
            titular: { type: 'string', nullable: true },
            ultimos_digitos: { type: 'string', example: '4242' }
          }
        }),
        responses: {
          200: ok(ref('Inscripcion'), 'Pago simulado registrado correctamente.'),
          ...comunes
        }
      }
    },
    '/api/kits': {
      get: {
        tags: ['Kits'],
        summary: 'Listar inscripciones pagadas y estado de kit',
        security: bearer,
        parameters: [
          ...paginacionParams,
          parametroComun('id_evento', 'integer', 'Filtra por evento.'),
          parametroComun('id_categoria', 'integer', 'Filtra por categoria.'),
          parametroComun('estado_kit', 'string', 'Filtra por estado de kit.', { enum: ['pendiente', 'entregado'] }),
          parametroComun('q', 'string', 'Busca por nombre, email, dorsal o chip.')
        ],
        responses: {
          200: ok({ type: 'array', items: ref('Inscripcion') }, 'Kits obtenidos correctamente.'),
          ...comunes
        }
      }
    },
    '/api/kits/entregar': {
      put: {
        tags: ['Kits'],
        summary: 'Validar y entregar kit + dorsal',
        description: 'Requiere pago completado. Si no se envia numero_dorsal, se asigna automaticamente y de forma unica.',
        security: bearer,
        requestBody: cuerpo(ref('KitEntregaRequest')),
        responses: {
          200: ok(ref('Inscripcion'), 'Kit y dorsal entregados correctamente.'),
          409: err('Pago pendiente, kit ya entregado o dorsal/chip duplicado.'),
          ...comunes
        }
      }
    },
    '/api/kits/{idInscripcion}': {
      get: {
        tags: ['Kits'],
        summary: 'Consultar kit de una inscripcion',
        security: bearer,
        parameters: [idPath('idInscripcion', 'Id de la inscripcion.')],
        responses: {
          200: ok(ref('Inscripcion')),
          ...comunes
        }
      }
    },
    '/api/cronometraje/marcar': {
      post: {
        tags: ['Cronometraje'],
        summary: 'Registrar paso de un dorsal por un checkpoint',
        description: 'Staff/cronometrador. Un dorsal solo puede tener una marcacion por nombre de punto. Devuelve el calculo de tiempos.',
        security: bearer,
        requestBody: cuerpo(ref('MarcacionRequest')),
        responses: {
          201: creado(ref('Marcacion'), 'Marcacion registrada correctamente.'),
          409: err('Marcacion duplicada, dorsal sin pago o evento incorrecto.'),
          ...comunes
        }
      }
    },
    '/api/cronometraje/evento/{idEvento}': {
      get: {
        tags: ['Cronometraje'],
        summary: 'Feed de marcaciones en vivo de un evento',
        security: [],
        parameters: [
          idPath('idEvento', 'Id del evento.'),
          ...paginacionParams,
          parametroComun('punto', 'string', 'Filtra por punto de control (ej. KM 5).'),
          parametroComun('numero_dorsal', 'integer', 'Filtra por dorsal.'),
          parametroComun('id_categoria', 'integer', 'Filtra por categoria.'),
          parametroComun('desde', 'string', 'Marcaciones desde (ISO 8601).', { format: 'date-time' }),
          parametroComun('hasta', 'string', 'Marcaciones hasta (ISO 8601).', { format: 'date-time' })
        ],
        responses: {
          200: ok({ type: 'array', items: ref('Marcacion') }, 'Marcaciones obtenidas correctamente.'),
          ...comunes
        }
      }
    },
    '/api/cronometraje/dorsal/{idDorsal}': {
      get: {
        tags: ['Cronometraje'],
        summary: 'Marcaciones y tiempos de un dorsal',
        security: [],
        parameters: [idPath('idDorsal', 'Id del dorsal.')],
        responses: {
          200: ok(ref('Marcacion')),
          ...comunes
        }
      }
    },
    '/api/cronometraje/{idTiempo}': {
      put: {
        tags: ['Cronometraje'],
        summary: 'Corregir una marcacion (admin)',
        security: bearer,
        parameters: [idPath('idTiempo', 'Id de la marcacion.')],
        requestBody: cuerpo(ref('MarcacionUpdateRequest')),
        responses: {
          200: ok(ref('Marcacion'), 'Marcacion actualizada correctamente.'),
          ...comunes
        }
      },
      delete: {
        tags: ['Cronometraje'],
        summary: 'Eliminar una marcacion (admin)',
        security: bearer,
        parameters: [idPath('idTiempo', 'Id de la marcacion.')],
        responses: {
          200: ok({
            type: 'object',
            properties: { id_tiempo: { type: 'integer' } }
          }, 'Marcacion eliminada correctamente.'),
          ...comunes
        }
      }
    },
    '/api/resultados/evento/{idEvento}': {
      get: {
        tags: ['Resultados'],
        summary: 'Tabla de posiciones por categoria (publico)',
        description: 'Calcula posiciones con tiempo neto entre SALIDA y META. Los empates comparten posicion.',
        security: [],
        parameters: [
          idPath('idEvento', 'Id del evento.'),
          filtroGenero,
          parametroComun('id_categoria', 'integer', 'Limita a una categoria.')
        ],
        responses: {
          200: ok({
            type: 'object',
            properties: {
              evento: ref('Evento'),
              filtros: { type: 'object' },
              resumen: { type: 'object' },
              categorias: { type: 'array', items: ref('ResultadoCategoria') }
            }
          }, 'Resultados del evento obtenidos correctamente.'),
          ...comunes
        }
      }
    },
    '/api/resultados/categoria/{idCategoria}': {
      get: {
        tags: ['Resultados'],
        summary: 'Tabla de posiciones de una categoria (publico)',
        security: [],
        parameters: [
          idPath('idCategoria', 'Id de la categoria.'),
          filtroGenero
        ],
        responses: {
          200: ok({
            type: 'object',
            properties: {
              evento: ref('Evento'),
              filtros: { type: 'object' },
              resumen: { type: 'object' },
              categoria: ref('ResultadoCategoria')
            }
          }, 'Resultados de la categoria obtenidos correctamente.'),
          ...comunes
        }
      }
    },
    '/api/resultados/dorsal/{numeroDorsal}': {
      get: {
        tags: ['Resultados'],
        summary: 'Tiempos y parciales de un dorsal (publico)',
        security: [],
        parameters: [idPath('numeroDorsal', 'Numero de dorsal.')],
        responses: {
          200: ok(ref('Marcacion')),
          ...comunes
        }
      }
    },
    '/api/resultados/certificado/{numeroDorsal}': {
      get: {
        tags: ['Resultados'],
        summary: 'Datos del certificado digital de finalizacion',
        description: 'Disponible solo si el corredor registro SALIDA y META. Incluye codigo de verificacion.',
        security: [],
        parameters: [idPath('numeroDorsal', 'Numero de dorsal.')],
        responses: {
          200: ok(ref('Certificado'), 'Datos del certificado digital generados correctamente.'),
          409: err('El corredor aun no ha finalizado o no registro salida.'),
          ...comunes
        }
      }
    }
  }
};

module.exports = api;
