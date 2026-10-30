'use strict';

const express = require('express');
const controller = require('../controllers/categorias.controller');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const v = require('../validators');

const router = express.Router();

router.get('/:id', v.idParam('id'), validate, asyncHandler(controller.obtener));
router.put('/:id', authenticate, authorize('admin'), v.idParam('id'), v.actualizarCategoria, validate, asyncHandler(controller.actualizar));
router.delete('/:id', authenticate, authorize('admin'), v.idParam('id'), validate, asyncHandler(controller.eliminar));

module.exports = router;
