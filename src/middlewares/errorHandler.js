'use strict';

const {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError
} = require('sequelize');
const env = require('../config/env');
const { construirRespuesta } = require('../utils/response');

function mapearError(err) {
  if (err instanceof UniqueConstraintError) {
    const campos = [...new Set(err.errors.map((e) => e.path).filter(Boolean))];
    return {
      statusCode: 409,
      message: campos.length
        ? `Ya existe un registro con el mismo valor en: ${campos.join(', ')}.`
        : 'Ya existe un registro con esos datos.',
      code: 'UNIQUE_CONSTRAINT',
      details: campos.length ? { campos } : null
    };
  }

  if (err instanceof ForeignKeyConstraintError) {
    return {
      statusCode: 409,
      message: 'La operacion viola una relacion entre entidades.',
      code: 'FOREIGN_KEY_CONSTRAINT',
      details: null
    };
  }

  if (err instanceof ValidationError) {
    return {
      statusCode: 422,
      message: 'Los datos no cumplen las reglas de validacion.',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({ campo: e.path, mensaje: e.message }))
    };
  }

  if (err instanceof DatabaseError) {
    return {
      statusCode: 500,
      message: 'Error de base de datos.',
      code: 'DATABASE_ERROR',
      details: null
    };
  }

  if (err.type === 'entity.parse.failed') {
    return {
      statusCode: 400,
      message: 'El cuerpo de la peticion no contiene JSON valido.',
      code: 'INVALID_JSON',
      details: null
    };
  }

  if (err.type === 'entity.too.large') {
    return {
      statusCode: 413,
      message: 'El cuerpo de la peticion es demasiado grande.',
      code: 'PAYLOAD_TOO_LARGE',
      details: null
    };
  }

  return {
    statusCode: err.statusCode || 500,
    message: err.expose === false || !err.message
      ? 'Error interno del servidor.'
      : err.message,
    code: err.code || 'INTERNAL_ERROR',
    details: err.details || null
  };
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const mapped = mapearError(err);
  const statusCode = mapped.statusCode;

  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);
  }

  return res.status(statusCode).json(construirRespuesta(req, {
    success: false,
    message: mapped.message,
    data: null,
    error: {
      code: mapped.code,
      details: mapped.details
    }
  }));
}

module.exports = errorHandler;
