'use strict';

const bcrypt = require('bcryptjs');
const {
  Usuario,
  Rol,
  Inscripcion,
  Op
} = require('../models');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const authService = require('./auth.service');

const atributosUsuario = [
  'id_usuario', 'id_rol', 'nombre', 'apellido', 'email', 'telefono',
  'contacto_emergencia', 'ficha_medica_json', 'modo_oscuro_pref',
  'estado_cuenta', 'fecha_nacimiento', 'genero', 'created_at', 'updated_at'
];

async function listarUsuarios(query) {
  const { page, limit, offset } = getPagination(query, { defaultLimit: 20, maxLimit: 100 });
  const where = {};

  if (query.estado_cuenta) where.estado_cuenta = query.estado_cuenta;
  if (query.id_rol) where.id_rol = query.id_rol;

  if (query.q) {
    where[Op.or] = [
      { nombre: { [Op.like]: `%${query.q}%` } },
      { apellido: { [Op.like]: `%${query.q}%` } },
      { email: { [Op.like]: `%${query.q}%` } }
    ];
  }

  const { rows, count } = await Usuario.findAndCountAll({
    attributes: atributosUsuario,
    where,
    include: [{
      model: Rol,
      as: 'rol',
      attributes: ['id_rol', 'nombre_rol'],
      required: Boolean(query.rol),
      where: query.rol ? { nombre_rol: query.rol } : undefined
    }],
    order: [['apellido', 'ASC'], ['nombre', 'ASC']],
    limit,
    offset,
    distinct: true
  });

  return { data: rows, meta: buildPaginationMeta(count, page, limit) };
}

async function obtenerUsuario(idUsuario) {
  return authService.buscarPorId(idUsuario);
}

async function crearUsuario(payload) {
  if (!authService.ROLES_VALIDOS.includes(payload.rol)) {
    throw ApiError.unprocessable('Rol invalido.', { permitidos: authService.ROLES_VALIDOS });
  }

  return authService.crearUsuario(payload, { rol: payload.rol });
}

async function actualizarUsuario(idUsuario, payload) {
  const usuario = await Usuario.findByPk(idUsuario);
  if (!usuario) throw ApiError.notFound('Usuario no encontrado.');

  if (payload.email !== undefined) {
    const email = String(payload.email).trim().toLowerCase();
    const existente = await Usuario.unscoped().findOne({
      where: { email, id_usuario: { [Op.ne]: idUsuario } }
    });
    if (existente) throw ApiError.conflict('El email ya esta en uso por otro usuario.');
    usuario.email = email;
  }

  if (payload.rol !== undefined) {
    if (!authService.ROLES_VALIDOS.includes(payload.rol)) {
      throw ApiError.unprocessable('Rol invalido.', { permitidos: authService.ROLES_VALIDOS });
    }
    const rol = await authService.obtenerRol(payload.rol);
    usuario.id_rol = rol.id_rol;
  }

  const campos = [
    'nombre', 'apellido', 'telefono', 'contacto_emergencia',
    'ficha_medica_json', 'modo_oscuro_pref', 'estado_cuenta',
    'fecha_nacimiento', 'genero'
  ];

  campos.forEach((campo) => {
    if (payload[campo] !== undefined) usuario[campo] = payload[campo];
  });

  await usuario.save();
  return authService.buscarPorId(idUsuario);
}

async function cambiarEstadoCuenta(idUsuario, estadoCuenta, actorId) {
  if (!['activo', 'inactivo'].includes(estadoCuenta)) {
    throw ApiError.unprocessable('Estado de cuenta invalido.', {
      permitidos: ['activo', 'inactivo']
    });
  }

  if (Number(idUsuario) === Number(actorId) && estadoCuenta === 'inactivo') {
    throw ApiError.conflict('No puede desactivar su propia cuenta.');
  }

  const usuario = await Usuario.findByPk(idUsuario);
  if (!usuario) throw ApiError.notFound('Usuario no encontrado.');

  usuario.estado_cuenta = estadoCuenta;
  await usuario.save();

  return { id_usuario: usuario.id_usuario, estado_cuenta: usuario.estado_cuenta };
}

async function desactivarUsuario(idUsuario, actorId) {
  return cambiarEstadoCuenta(idUsuario, 'inactivo', actorId);
}

async function restablecerPassword(idUsuario, passwordNueva) {
  const usuario = await Usuario.unscoped().findByPk(idUsuario);
  if (!usuario) throw ApiError.notFound('Usuario no encontrado.');

  usuario.password_hash = await bcrypt.hash(passwordNueva, env.security.bcryptSaltRounds);
  await usuario.save();

  return { id_usuario: usuario.id_usuario };
}

async function obtenerHistorialUsuario(idUsuario) {
  const inscripciones = await Inscripcion.findAll({
    where: { id_usuario: idUsuario },
    order: [['fecha_inscripcion', 'DESC']]
  });

  return {
    id_usuario: Number(idUsuario),
    total_inscripciones: inscripciones.length,
    inscripciones
  };
}

module.exports = {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  cambiarEstadoCuenta,
  desactivarUsuario,
  restablecerPassword,
  obtenerHistorialUsuario
};
