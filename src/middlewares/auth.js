'use strict';

const { Usuario, Rol } = require('../models');
const ApiError = require('../utils/ApiError');
const { verificarToken } = require('../utils/jwt');

function extraerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token || null;
}

async function resolverUsuario(req) {
  const token = extraerToken(req);
  if (!token) return null;

  let payload;
  try {
    payload = verificarToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('El token ha expirado. Inicie sesion nuevamente.');
    }
    throw ApiError.unauthorized('Token invalido.');
  }

  const usuario = await Usuario.findByPk(payload.sub, {
    include: [{ model: Rol, as: 'rol', attributes: ['id_rol', 'nombre_rol'] }]
  });

  if (!usuario || usuario.estado_cuenta !== 'activo') {
    throw ApiError.unauthorized('La cuenta no existe o se encuentra inactiva.');
  }

  req.user = usuario;
  req.rol = usuario.rol?.nombre_rol || null;
  req.temaModoOscuro = Boolean(usuario.modo_oscuro_pref);
  return usuario;
}

/**
 * Autenticacion obligatoria.
 */
async function authenticate(req, res, next) {
  try {
    if (req.authError) throw req.authError;
    if (req.user) return next();

    const usuario = await resolverUsuario(req);
    if (!usuario) throw ApiError.unauthorized();
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Autenticacion opcional: permite que las rutas publicas conozcan al usuario
 * (y su tema) sin exigir token. Un token invalido no bloquea la peticion.
 */
async function optionalAuth(req, res, next) {
  try {
    await resolverUsuario(req);
  } catch (error) {
    req.user = null;
    req.rol = null;
    req.temaModoOscuro = false;
    req.authError = error;
  }
  return next();
}

/**
 * RBAC: autoriza segun el rol contenido en el token/BD.
 */
function authorize(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!rolesPermitidos.includes(req.rol)) {
      return next(ApiError.forbidden(
        `El rol "${req.rol}" no tiene acceso a este recurso.`
      ));
    }
    return next();
  };
}

module.exports = { authenticate, optionalAuth, authorize, extraerToken };
