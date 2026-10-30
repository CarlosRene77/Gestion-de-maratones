'use strict';

class ApiError extends Error {
  constructor(statusCode, message, options = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = options.code || 'ERROR';
    this.details = options.details || null;
    this.expose = statusCode < 500;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message, details) {
    return new ApiError(400, message, { code: 'BAD_REQUEST', details });
  }

  static unauthorized(message = 'No autenticado o token invalido.') {
    return new ApiError(401, message, { code: 'UNAUTHORIZED' });
  }

  static forbidden(message = 'No tiene permisos para realizar esta accion.') {
    return new ApiError(403, message, { code: 'FORBIDDEN' });
  }

  static notFound(message = 'Recurso no encontrado.') {
    return new ApiError(404, message, { code: 'NOT_FOUND' });
  }

  static conflict(message, details) {
    return new ApiError(409, message, { code: 'CONFLICT', details });
  }

  static unprocessable(message, details) {
    return new ApiError(422, message, { code: 'VALIDATION_ERROR', details });
  }
}

module.exports = ApiError;
