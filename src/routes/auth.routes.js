'use strict';

const express = require('express');
const controller = require('../controllers/auth.controller');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimit');
const v = require('../validators');

const router = express.Router();

router.post('/register', authLimiter, v.register, validate, asyncHandler(controller.register));
router.post('/login', authLimiter, v.login, validate, asyncHandler(controller.login));

router.get('/me', authenticate, asyncHandler(controller.me));
router.put('/me', authenticate, v.actualizarPerfil, validate, asyncHandler(controller.actualizarPerfil));
router.put('/password', authenticate, v.cambiarPassword, validate, asyncHandler(controller.cambiarPassword));
router.put('/preferencias', authenticate, v.preferenciaTema, validate, asyncHandler(controller.preferenciaTema));
router.post('/logout', authenticate, asyncHandler(controller.logout));

module.exports = router;
