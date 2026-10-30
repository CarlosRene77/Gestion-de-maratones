'use strict';

const express = require('express');
const controller = require('../controllers/inscripciones.controller');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const v = require('../validators');

const router = express.Router();

router.use(authenticate);

router.get('/', authorize('admin', 'corredor'), v.listarInscripciones, validate, asyncHandler(controller.listar));
router.post('/', authorize('admin', 'corredor'), v.crearInscripcion, validate, asyncHandler(controller.crear));
router.get('/:id', authorize('admin', 'corredor'), v.idParam('id'), validate, asyncHandler(controller.obtener));
router.patch('/:id/pago', authorize('admin'), v.idParam('id'), v.cambiarEstadoPago, validate, asyncHandler(controller.cambiarEstadoPago));
router.post('/:id/pago-simulado', authorize('admin', 'corredor'), v.idParam('id'), v.pagoSimulado, validate, asyncHandler(controller.pagoSimulado));
router.delete('/:id', authorize('admin', 'corredor'), v.idParam('id'), validate, asyncHandler(controller.cancelar));

module.exports = router;
