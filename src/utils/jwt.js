'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');

const ISSUER = 'marathonhub-api';
const AUDIENCE = 'marathonhub-clients';

function firmarToken(usuario) {
  const rol = typeof usuario.rol === 'object' ? usuario.rol?.nombre_rol : usuario.rol;
  return jwt.sign(
    {
      sub: usuario.id_usuario,
      rol,
      id_rol: usuario.id_rol
    },
    env.jwt.secret,
    {
      expiresIn: env.jwt.expiresIn,
      issuer: ISSUER,
      audience: AUDIENCE
    }
  );
}

function verificarToken(token) {
  return jwt.verify(token, env.jwt.secret, {
    issuer: ISSUER,
    audience: AUDIENCE
  });
}

module.exports = { firmarToken, verificarToken, ISSUER, AUDIENCE };
