'use strict';

/**
 * Envuelve controladores async para delegar errores al middleware global.
 * Express 5 ya lo hace de forma nativa, pero se mantiene por compatibilidad
 * y claridad en los controladores.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
