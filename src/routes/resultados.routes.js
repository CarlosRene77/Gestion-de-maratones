'use strict';

const express = require('express');
const controller = require('../controllers/resultados.controller');
const asyncHandler = require('../utils/asyncHandler');
const validate = require('../middlewares/validate');
const v = require('../validators');

const router = express.Router();

router.get('/evento/:idEvento', v.idParam('idEvento'), v.filtrosResultados, validate, asyncHandler(controller.porEvento));
router.get('/categoria/:idCategoria', v.idParam('idCategoria'), v.filtrosResultados, validate, asyncHandler(controller.porCategoria));
router.get('/dorsal/:numeroDorsal', v.idParam('numeroDorsal'), validate, asyncHandler(controller.porDorsal));
router.get('/certificado/:numeroDorsal', v.idParam('numeroDorsal'), validate, asyncHandler(controller.certificado));

module.exports = router;
