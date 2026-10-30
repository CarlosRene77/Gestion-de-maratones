'use strict';

const bcrypt = require('bcryptjs');
const { Usuario, Rol, Op } = require('../models');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');
const { firmarToken } = require('../utils/jwt');

const ROLES_VALIDOS = ['admin', 'staff', 'corredor'];

async function obtenerRol(nombreRol) {
  const rol = await Rol.findOne({ where: { nombre_rol: nombreRol } });
  if (!rol) {
    throw new ApiError(500, `El rol "${nombreRol}" no existe. Ejecute los seeders.`);
  }
  return rol;
}

function serializarUsuario(usuario) {
  const plain = usuario?.get ? usuario.get({ plain: true }) : { ...usuario };
  delete plain.password_hash;
  return plain;
}

async function buscarPorId(idUsuario) {
  const usuario = await Usuario.findByPk(idUsuario, {
    include: [{ model: Rol, as: 'rol', attributes: ['id_rol', 'nombre_rol'] }]
  });
  if (!usuario) throw ApiError.notFound('Usuario no encontrado.');
  return usuario;
}

async function crearUsuario(payload, { rol = 'corredor', estadoCuenta = 'activo' } = {}) {
  const email = String(payload.email).trim().toLowerCase();
  const rolDb = await obtenerRol(rol);

  const existente = await Usuario.unscoped().findOne({ where: { email } });
  if (existente) {
    throw ApiError.conflict('Ya existe un usuario registrado con ese email.');
  }

  const passwordHash = await bcrypt.hash(payload.password, env.security.bcryptSaltRounds);

  const usuario = await Usuario.create({
    id_rol: rolDb.id_rol,
    nombre: payload.nombre,
    apellido: payload.apellido,
    email,
    password_hash: passwordHash,
    telefono: payload.telefono ?? null,
    contacto_emergencia: payload.contacto_emergencia ?? null,
    ficha_medica_json: payload.ficha_medica_json ?? null,
    modo_oscuro_pref: Boolean(payload.modo_oscuro_pref),
    estado_cuenta: estadoCuenta,
    fecha_nacimiento: payload.fecha_nacimiento ?? null,
    genero: payload.genero ?? null
  });

  return buscarPorId(usuario.id_usuario);
}

async function registrarCorredor(payload) {
  const usuario = await crearUsuario(payload, { rol: 'corredor' });
  const token = firmarToken(usuario);

  return {
    token,
    token_type: 'Bearer',
    expires_in: env.jwt.expiresIn,
    usuario: serializarUsuario(usuario)
  };
}

async function iniciarSesion(email, password) {
  const usuario = await Usuario.unscoped().findOne({
    where: { email: String(email).trim().toLowerCase() },
    include: [{ model: Rol, as: 'rol', attributes: ['id_rol', 'nombre_rol'] }]
  });

  const mensajeGenerico = 'Credenciales invalidas.';
  if (!usuario) throw ApiError.unauthorized(mensajeGenerico);

  const coincide = await bcrypt.compare(password, usuario.password_hash);
  if (!coincide) throw ApiError.unauthorized(mensajeGenerico);

  if (usuario.estado_cuenta !== 'activo') {
    throw ApiError.forbidden('La cuenta se encuentra inactiva.');
  }

  const token = firmarToken(usuario);

  return {
    token,
    token_type: 'Bearer',
    expires_in: env.jwt.expiresIn,
    usuario: serializarUsuario(usuario)
  };
}

async function actualizarPerfil(idUsuario, payload) {
  const usuario = await Usuario.findByPk(idUsuario);
  if (!usuario) throw ApiError.notFound('Usuario no encontrado.');

  const campos = [
    'nombre', 'apellido', 'telefono', 'contacto_emergencia',
    'ficha_medica_json', 'fecha_nacimiento', 'genero', 'modo_oscuro_pref'
  ];

  campos.forEach((campo) => {
    if (payload[campo] !== undefined) usuario[campo] = payload[campo];
  });

  await usuario.save();
  return serializarUsuario(await buscarPorId(idUsuario));
}

async function cambiarPassword(idUsuario, passwordActual, passwordNueva) {
  const usuario = await Usuario.unscoped().findByPk(idUsuario);
  if (!usuario) throw ApiError.notFound('Usuario no encontrado.');

  const coincide = await bcrypt.compare(passwordActual, usuario.password_hash);
  if (!coincide) throw ApiError.badRequest('La contrasena actual no es correcta.');

  usuario.password_hash = await bcrypt.hash(passwordNueva, env.security.bcryptSaltRounds);
  await usuario.save();

  return { id_usuario: usuario.id_usuario };
}

async function cambiarPreferenciaTema(idUsuario, modoOscuro) {
  const usuario = await Usuario.findByPk(idUsuario);
  if (!usuario) throw ApiError.notFound('Usuario no encontrado.');

  usuario.modo_oscuro_pref = Boolean(modoOscuro);
  await usuario.save();

  return { modo_oscuro_pref: usuario.modo_oscuro_pref };
}

module.exports = {
  ROLES_VALIDOS,
  obtenerRol,
  serializarUsuario,
  buscarPorId,
  crearUsuario,
  registrarCorredor,
  iniciarSesion,
  actualizarPerfil,
  cambiarPassword,
  cambiarPreferenciaTema
};
