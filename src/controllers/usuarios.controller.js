'use strict';

const usuariosService = require('../services/usuarios.service');

async function listar(req, res) {
  const { data, meta } = await usuariosService.listarUsuarios(req.query);
  return res.success(data, 'Usuarios obtenidos correctamente.', meta);
}

async function obtener(req, res) {
  const data = await usuariosService.obtenerUsuario(req.params.id);
  return res.success(data, 'Usuario obtenido correctamente.');
}

async function crear(req, res) {
  const data = await usuariosService.crearUsuario(req.body);
  return res.created(data, 'Usuario creado correctamente.');
}

async function actualizar(req, res) {
  const data = await usuariosService.actualizarUsuario(req.params.id, req.body);
  return res.success(data, 'Usuario actualizado correctamente.');
}

async function cambiarEstado(req, res) {
  const data = await usuariosService.cambiarEstadoCuenta(
    req.params.id,
    req.body.estado_cuenta,
    req.user.id_usuario
  );
  return res.success(data, 'Estado de cuenta actualizado.');
}

async function desactivar(req, res) {
  const data = await usuariosService.desactivarUsuario(req.params.id, req.user.id_usuario);
  return res.success(data, 'Usuario desactivado correctamente.');
}

async function restablecerPassword(req, res) {
  const data = await usuariosService.restablecerPassword(
    req.params.id,
    req.body.password_nueva
  );
  return res.success(data, 'Contrasena restablecida correctamente.');
}

module.exports = {
  listar,
  obtener,
  crear,
  actualizar,
  cambiarEstado,
  desactivar,
  restablecerPassword
};
