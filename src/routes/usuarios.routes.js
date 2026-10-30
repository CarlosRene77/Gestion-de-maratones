'use strict';

const express = require('express');
const controller = require('../controllers/usuarios.controller');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const v = require('../validators');

const router = express.Router();

router.use(authenticate, authorize('admin'));

router.get('/', v.listarUsuarios, validate, asyncHandler(controller.listar));
router.get('/:id', v.idParam('id'), validate, asyncHandler(controller.obtener));
router.post('/', v.crearUsuario, validate, asyncHandler(controller.crear));
router.put('/:id', v.idParam('id'), v.actualizarUsuario, validate, asyncHandler(controller.actualizar));
router.patch('/:id/estado', v.idParam('id'), v.cambiarEstadoCuenta, validate, asyncHandler(controller.cambiarEstado));
router.put('/:id/password', v.idParam('id'), v.resetPassword, validate, asyncHandler(controller.restablecerPassword));
router.delete('/:id', v.idParam('id'), validate, asyncHandler(controller.desactivar));

module.exports = router;
