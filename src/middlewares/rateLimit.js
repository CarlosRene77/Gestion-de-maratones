'use strict';

const { rateLimit } = require('express-rate-limit');
const env = require('../config/env');
const { construirRespuesta } = require('../utils/response');

function limiterHandler(message) {
  return (req, res) => {
    return res.status(429).json(construirRespuesta(req, {
      success: false,
      message,
      data: null,
      error: { code: 'TOO_MANY_REQUESTS', details: null }
    }));
  };
}

const generalLimiter = rateLimit({
  windowMs: env.security.rateLimitWindowMs,
  max: env.security.rateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => env.isTest,
  handler: limiterHandler('Demasiadas solicitudes. Intente nuevamente mas tarde.')
});

const authLimiter = rateLimit({
  windowMs: env.security.rateLimitWindowMs,
  max: env.security.authRateLimitMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: () => env.isTest,
  handler: limiterHandler('Demasiados intentos de autenticacion. Intente nuevamente mas tarde.')
});

module.exports = { generalLimiter, authLimiter };
