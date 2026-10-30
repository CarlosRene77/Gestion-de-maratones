'use strict';

const { body, param, query } = require('express-validator');

const ROLES = ['admin', 'staff', 'corredor'];
const ESTADOS_EVENTO = ['borrador', 'publicado', 'en_curso', 'finalizado'];
const ESTADOS_PAGO = ['pendiente', 'completado', 'cancelado'];
const GENEROS = ['M', 'F', 'Mixto'];
const GENEROS_USUARIO = ['M', 'F'];

const paginacion = [
  query('page').optional().isInt({ min: 1 }).withMessage('page debe ser un entero mayor a 0.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100.').toInt()
];

const idParam = (nombre = 'id') => [
  param(nombre).isInt({ min: 1 }).withMessage(`${nombre} debe ser un entero positivo.`).toInt()
];

const email = () => body('email')
  .trim()
  .isEmail().withMessage('Debe indicar un email valido.')
  .isLength({ max: 150 }).withMessage('El email no puede superar 150 caracteres.');

const password = (campo = 'password', requerido = true) => {
  const chain = body(campo)
    .isLength({ min: 8, max: 72 })
    .withMessage('La contrasena debe tener entre 8 y 72 caracteres.');
  return [requerido ? chain : chain.optional()];
};

const datosPersonales = (opcional = false) => {
  const wrap = (chain) => (opcional ? chain.optional() : chain);
  return [
    wrap(body('nombre')).trim().isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres.'),
    wrap(body('apellido')).trim().isLength({ min: 2, max: 100 }).withMessage('El apellido debe tener entre 2 y 100 caracteres.'),
    wrap(body('telefono')).optional({ nullable: true }).trim().isLength({ max: 30 }),
    wrap(body('contacto_emergencia')).optional({ nullable: true }).trim().isLength({ max: 150 }),
    wrap(body('ficha_medica_json')).optional({ nullable: true }).isObject().withMessage('ficha_medica_json debe ser un objeto JSON.'),
    wrap(body('modo_oscuro_pref')).optional().isBoolean().toBoolean(),
    wrap(body('fecha_nacimiento')).optional({ nullable: true }).isISO8601().withMessage('fecha_nacimiento debe tener formato ISO (YYYY-MM-DD).'),
    wrap(body('genero')).optional({ nullable: true }).isIn(GENEROS_USUARIO).withMessage('genero debe ser M o F.')
  ];
};

const register = [
  ...datosPersonales(false),
  email(),
  ...password('password')
];

const login = [
  email(),
  body('password').notEmpty().withMessage('La contrasena es obligatoria.')
];

const actualizarPerfil = [
  ...datosPersonales(true),
  body('nombre').optional().trim().isLength({ min: 2, max: 100 }),
  body('apellido').optional().trim().isLength({ min: 2, max: 100 })
];

const cambiarPassword = [
  body('password_actual').notEmpty().withMessage('Debe indicar la contrasena actual.'),
  ...password('password_nueva')
];

const preferenciaTema = [
  body('modo_oscuro_pref')
    .exists().withMessage('modo_oscuro_pref es obligatorio.')
    .isBoolean().withMessage('modo_oscuro_pref debe ser booleano.')
    .toBoolean()
];

const crearUsuario = [
  ...datosPersonales(false),
  email(),
  ...password('password'),
  body('rol').isIn(ROLES).withMessage('Rol invalido.'),
  body('estado_cuenta').optional().isIn(['activo', 'inactivo']).toLowerCase()
];

const actualizarUsuario = [
  ...datosPersonales(true),
  body('nombre').optional().trim().isLength({ min: 2, max: 100 }),
  body('apellido').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().trim().isEmail().isLength({ max: 150 }),
  body('rol').optional().isIn(ROLES),
  body('estado_cuenta').optional().isIn(['activo', 'inactivo']).toLowerCase()
];

const resetPassword = [
  ...password('password_nueva')
];

const cambiarEstadoCuenta = [
  body('estado_cuenta')
    .exists().withMessage('estado_cuenta es obligatorio.')
    .isIn(['activo', 'inactivo'])
    .withMessage('estado_cuenta debe ser activo o inactivo.')
];

const listarUsuarios = [
  ...paginacion,
  query('rol').optional().isIn(ROLES),
  query('estado_cuenta').optional().isIn(['activo', 'inactivo']),
  query('id_rol').optional().isInt({ min: 1 }).toInt(),
  query('q').optional().trim().isLength({ max: 100 })
];

const crearEvento = [
  body('nombre_evento').trim().isLength({ min: 3, max: 150 }).withMessage('El nombre del evento debe tener entre 3 y 150 caracteres.'),
  body('descripcion').optional({ nullable: true }).isString().isLength({ max: 5000 }),
  body('fecha_evento').isISO8601().withMessage('fecha_evento debe ser una fecha ISO valida.').toDate(),
  body('ciudad').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('lugar_salida').optional({ nullable: true }).trim().isLength({ max: 150 }),
  body('estado').optional().isIn(ESTADOS_EVENTO).withMessage('Estado de evento invalido.'),
  body('imagen_banner').optional({ nullable: true }).isString().isLength({ max: 500 })
];

const actualizarEvento = [
  body('nombre_evento').optional().trim().isLength({ min: 3, max: 150 }),
  body('descripcion').optional({ nullable: true }).isString().isLength({ max: 5000 }),
  body('fecha_evento').optional().isISO8601().withMessage('fecha_evento debe ser una fecha ISO valida.').toDate(),
  body('ciudad').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('lugar_salida').optional({ nullable: true }).trim().isLength({ max: 150 }),
  body('estado').optional().isIn(ESTADOS_EVENTO).withMessage('Estado de evento invalido.'),
  body('imagen_banner').optional({ nullable: true }).isString().isLength({ max: 500 })
];

const cambiarEstadoEvento = [
  body('estado')
    .exists().withMessage('estado es obligatorio.')
    .isIn(ESTADOS_EVENTO)
    .withMessage(`estado debe ser uno de: ${ESTADOS_EVENTO.join(', ')}.`)
];

const listarEventos = [
  ...paginacion,
  query('estado').optional().isIn(ESTADOS_EVENTO),
  query('ciudad').optional().trim().isLength({ max: 100 }),
  query('q').optional().trim().isLength({ max: 150 }),
  query('desde').optional().isISO8601(),
  query('hasta').optional().isISO8601(),
  query('sort').optional().isIn(['fecha_evento', 'nombre_evento', 'created_at']),
  query('order').optional().isIn(['asc', 'desc', 'ASC', 'DESC'])
];

const datosCategoria = (opcional = false) => {
  const wrap = (chain) => (opcional ? chain.optional() : chain);
  return [
    wrap(body('nombre_cat')).trim().isLength({ min: 2, max: 120 }).withMessage('El nombre de la categoria debe tener entre 2 y 120 caracteres.'),
    wrap(body('distancia_km')).isFloat({ gt: 0, max: 1000 }).withMessage('distancia_km debe ser mayor a 0.').toFloat(),
    wrap(body('cupo_maximo')).isInt({ min: 1, max: 1000000 }).withMessage('cupo_maximo debe ser un entero positivo.').toInt(),
    wrap(body('precio')).isFloat({ min: 0, max: 100000000 }).withMessage('precio debe ser mayor o igual a 0.').toFloat(),
    wrap(body('edad_minima')).optional({ nullable: true }).isInt({ min: 0, max: 120 }).withMessage('edad_minima invalida.').toInt(),
    wrap(body('edad_maxima')).optional({ nullable: true }).isInt({ min: 0, max: 120 }).withMessage('edad_maxima invalida.').toInt(),
    wrap(body('genero')).isIn(GENEROS).withMessage('genero debe ser M, F o Mixto.')
  ];
};

const crearCategoria = [...datosCategoria(false)];
const actualizarCategoria = [...datosCategoria(true)];

const crearInscripcion = [
  body('id_categoria').isInt({ min: 1 }).withMessage('id_categoria es obligatorio.').toInt(),
  body('talla_camiseta').optional({ nullable: true }).trim().isLength({ max: 10 }),
  body('codigo_transaccion').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('id_usuario').optional().isInt({ min: 1 }).withMessage('id_usuario invalido.').toInt(),
  body('estado_pago').optional().isIn(ESTADOS_PAGO)
];

const listarInscripciones = [
  ...paginacion,
  query('id_evento').optional().isInt({ min: 1 }).toInt(),
  query('id_categoria').optional().isInt({ min: 1 }).toInt(),
  query('id_usuario').optional().isInt({ min: 1 }).toInt(),
  query('estado_pago').optional().isIn(ESTADOS_PAGO),
  query('q').optional().trim().isLength({ max: 100 })
];

const cambiarEstadoPago = [
  body('estado_pago')
    .exists().withMessage('estado_pago es obligatorio.')
    .isIn(ESTADOS_PAGO)
    .withMessage(`estado_pago debe ser uno de: ${ESTADOS_PAGO.join(', ')}.`)
];

const pagoSimulado = [
  body('metodo_pago').optional().trim().isIn(['tarjeta_simulada', 'comprobante']).withMessage('metodo_pago invalido.'),
  body('codigo_transaccion').optional({ nullable: true }).trim().isLength({ max: 100 }),
  body('titular').optional({ nullable: true }).trim().isLength({ max: 120 }),
  body('ultimos_digitos').optional({ nullable: true }).trim().matches(/^\d{4}$/).withMessage('ultimos_digitos debe tener 4 numeros.')
];

const entregarKit = [
  body('id_inscripcion').isInt({ min: 1 }).withMessage('id_inscripcion es obligatorio.').toInt(),
  body('numero_dorsal').optional({ nullable: true }).isInt({ min: 1, max: 999999 }).withMessage('numero_dorsal invalido.').toInt(),
  body('chip_code').optional({ nullable: true }).trim().isLength({ max: 60 })
];

const listarKits = [
  ...paginacion,
  query('id_evento').optional().isInt({ min: 1 }).toInt(),
  query('id_categoria').optional().isInt({ min: 1 }).toInt(),
  query('estado_kit').optional().isIn(['pendiente', 'entregado']),
  query('q').optional().trim().isLength({ max: 100 })
];

const marcarTiempo = [
  body('id_dorsal').optional().isInt({ min: 1 }).toInt(),
  body('numero_dorsal').optional().isInt({ min: 1 }).toInt(),
  body().custom((value) => {
    if (!value.id_dorsal && !value.numero_dorsal) {
      throw new Error('Debe indicar id_dorsal o numero_dorsal.');
    }
    return true;
  }),
  body('nombre_punto').trim().isLength({ min: 1, max: 60 }).withMessage('nombre_punto es obligatorio.'),
  body('tiempo_marcado').optional().isISO8601().withMessage('tiempo_marcado debe ser una fecha ISO valida.').toDate(),
  body('id_evento').optional().isInt({ min: 1 }).toInt()
];

const listarMarcaciones = [
  ...paginacion,
  query('punto').optional().trim().isLength({ max: 60 }),
  query('desde').optional().isISO8601(),
  query('hasta').optional().isISO8601(),
  query('numero_dorsal').optional().isInt({ min: 1 }).toInt(),
  query('id_categoria').optional().isInt({ min: 1 }).toInt()
];

const actualizarMarcacion = [
  body('nombre_punto').optional().trim().isLength({ min: 1, max: 60 }),
  body('tiempo_marcado').optional().isISO8601().withMessage('tiempo_marcado debe ser una fecha ISO valida.').toDate(),
  body().custom((value) => {
    if (value.nombre_punto === undefined && value.tiempo_marcado === undefined) {
      throw new Error('Debe indicar nombre_punto o tiempo_marcado.');
    }
    return true;
  })
];

const filtrosResultados = [
  query('genero').optional().isIn(['M', 'F']),
  query('id_categoria').optional().isInt({ min: 1 }).toInt()
];

module.exports = {
  ROLES,
  ESTADOS_EVENTO,
  paginacion,
  idParam,
  register,
  login,
  actualizarPerfil,
  cambiarPassword,
  preferenciaTema,
  crearUsuario,
  actualizarUsuario,
  listarUsuarios,
  resetPassword,
  cambiarEstadoCuenta,
  crearEvento,
  actualizarEvento,
  cambiarEstadoEvento,
  listarEventos,
  crearCategoria,
  actualizarCategoria,
  crearInscripcion,
  listarInscripciones,
  cambiarEstadoPago,
  pagoSimulado,
  entregarKit,
  listarKits,
  marcarTiempo,
  listarMarcaciones,
  actualizarMarcacion,
  filtrosResultados
};
