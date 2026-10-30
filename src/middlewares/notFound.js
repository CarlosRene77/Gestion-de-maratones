'use strict';

function notFound(req, res, next) {
  const error = new Error(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  error.expose = true;
  next(error);
}

module.exports = notFound;
