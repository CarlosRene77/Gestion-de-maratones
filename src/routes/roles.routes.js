'use strict';

const express = require('express');
const controller = require('../controllers/roles.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/', authenticate, authorize('admin'), asyncHandler(controller.listar));

module.exports = router;
