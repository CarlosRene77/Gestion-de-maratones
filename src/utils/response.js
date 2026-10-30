'use strict';

function modoOscuroDe(req) {
  if (typeof req.temaModoOscuro === 'boolean') return req.temaModoOscuro;
  return Boolean(req.user?.modo_oscuro_pref);
}

/**
 * Construye el sobre JSON estandarizado de la API. Todas las respuestas
 * incluyen la preferencia visual del usuario para el frontend adaptativo
 * (RNF-05).
 */
function construirRespuesta(req, { success, message, data = null, meta, error }) {
  const body = {
    success,
    message,
    data,
    tema: {
      modo_oscuro: modoOscuroDe(req)
    }
  };

  if (meta) body.meta = meta;
  if (error) body.error = error;

  return body;
}

function responseEnhancer(req, res, next) {
  res.success = (data = null, message = 'Operacion exitosa.', meta) => {
    return res.status(200).json(construirRespuesta(req, {
      success: true,
      message,
      data,
      meta
    }));
  };

  res.created = (data = null, message = 'Recurso creado correctamente.') => {
    return res.status(201).json(construirRespuesta(req, {
      success: true,
      message,
      data
    }));
  };

  res.responder = (statusCode, data, message, meta) => {
    return res.status(statusCode).json(construirRespuesta(req, {
      success: true,
      message,
      data,
      meta
    }));
  };

  next();
}

module.exports = { responseEnhancer, construirRespuesta, modoOscuroDe };
