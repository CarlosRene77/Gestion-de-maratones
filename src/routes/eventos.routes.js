'use strict';

const express = require('express');
const controller = require('../controllers/eventos.controller');
const categoriasController = require('../controllers/categorias.controller');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const v = require('../validators');

const router = express.Router();

// Lectura publica
router.get('/', v.listarEventos, validate, asyncHandler(controller.listar));
router.get('/:idEvento/categorias', v.idParam('idEvento'), validate, asyncHandler(categoriasController.listarPorEvento));
router.get('/:id', v.idParam('id'), validate, asyncHandler(controller.obtener));

// Gestion (solo admin)
router.post('/', authenticate, authorize('admin'), v.crearEvento, validate, asyncHandler(controller.crear));
router.put('/:id', authenticate, authorize('admin'), v.idParam('id'), v.actualizarEvento, validate, asyncHandler(controller.actualizar));
router.patch('/:id/estado', authenticate, authorize('admin'), v.idParam('id'), v.cambiarEstadoEvento, validate, asyncHandler(controller.cambiarEstado));
router.delete('/:id', authenticate, authorize('admin'), v.idParam('id'), validate, asyncHandler(controller.eliminar));

// Estadisticas (solo admin)
router.get('/:id/estadisticas', authenticate, authorize('admin'), v.idParam('id'), validate, asyncHandler(controller.estadisticas));

// Categorias del evento (gestion)
router.post('/:idEvento/categorias', authenticate, authorize('admin'), v.idParam('idEvento'), v.crearCategoria, validate, asyncHandler(categoriasController.crear));

module.exports = router;
