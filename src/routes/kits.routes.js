'use strict';

const express = require('express');
const controller = require('../controllers/kits.controller');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middlewares/validate');
const { authenticate, authorize } = require('../middlewares/auth');
const v = require('../validators');

const router = express.Router();

router.use(authenticate, authorize('admin', 'staff'));

router.get('/', v.listarKits, validate, asyncHandler(controller.listar));
router.put('/entregar', v.entregarKit, validate, asyncHandler(controller.entregar));
router.get('/:idInscripcion', v.idParam('idInscripcion'), validate, asyncHandler(controller.obtener));

module.exports = router;
