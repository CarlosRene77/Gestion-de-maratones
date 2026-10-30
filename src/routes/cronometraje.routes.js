'use strict';

const express = require('express');
const controller = require('../controllers/cronometraje.controller');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const v = require('../validators');

const router = express.Router();

// Lectura publica (resultados en vivo)
router.get('/evento/:idEvento', v.idParam('idEvento'), v.listarMarcaciones, validate, asyncHandler(controller.listarPorEvento));
router.get('/dorsal/:idDorsal', v.idParam('idDorsal'), validate, asyncHandler(controller.obtenerPorDorsal));

// Registro de tiempos (staff / cronometrador)
router.post('/marcar', authenticate, authorize('admin', 'staff'), v.marcarTiempo, validate, asyncHandler(controller.marcar));

// Correcciones (solo admin)
router.put('/:idTiempo', authenticate, authorize('admin'), v.idParam('idTiempo'), v.actualizarMarcacion, validate, asyncHandler(controller.actualizar));
router.delete('/:idTiempo', authenticate, authorize('admin'), v.idParam('idTiempo'), validate, asyncHandler(controller.eliminar));

module.exports = router;
