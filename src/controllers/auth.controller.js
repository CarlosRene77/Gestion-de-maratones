'use strict';

const authService = require('../services/auth.service');

async function register(req, res) {
  const data = await authService.registrarCorredor(req.body);
  req.temaModoOscuro = data.usuario.modo_oscuro_pref;
  return res.created(data, 'Usuario registrado correctamente.');
}

async function login(req, res) {
  const data = await authService.iniciarSesion(req.body.email, req.body.password);
  req.temaModoOscuro = data.usuario.modo_oscuro_pref;
  return res.success(data, 'Inicio de sesion exitoso.');
}

async function me(req, res) {
  return res.success(authService.serializarUsuario(req.user), 'Perfil del usuario autenticado.');
}

async function actualizarPerfil(req, res) {
  const data = await authService.actualizarPerfil(req.user.id_usuario, req.body);
  req.temaModoOscuro = data.modo_oscuro_pref;
  return res.success(data, 'Perfil actualizado correctamente.');
}

async function cambiarPassword(req, res) {
  const data = await authService.cambiarPassword(
    req.user.id_usuario,
    req.body.password_actual,
    req.body.password_nueva
  );
  return res.success(data, 'Contrasena actualizada correctamente.');
}

async function preferenciaTema(req, res) {
  const data = await authService.cambiarPreferenciaTema(
    req.user.id_usuario,
    req.body.modo_oscuro_pref
  );
  req.temaModoOscuro = data.modo_oscuro_pref;
  return res.success(data, 'Preferencia de tema actualizada.');
}

async function logout(req, res) {
  return res.success(null, 'Sesion finalizada. Elimine el token en el cliente.');
}

module.exports = {
  register,
  login,
  me,
  actualizarPerfil,
  cambiarPassword,
  preferenciaTema,
  logout
};
