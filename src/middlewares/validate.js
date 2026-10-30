'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

/**
 * Ejecuta las validaciones declaradas en la ruta y devuelve un error 422
 * con el detalle por campo.
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array().map((error) => ({
    campo: error.path,
    mensaje: error.msg,
    valor: error.value
  }));

  return next(new ApiError(422, 'Los datos enviados no son validos.', {
    code: 'VALIDATION_ERROR',
    details
  }));
}

module.exports = validate;
