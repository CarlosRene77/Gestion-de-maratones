'use strict';

const express = require('express');
const authRoutes = require('./auth.routes');
const usuariosRoutes = require('./usuarios.routes');
const rolesRoutes = require('./roles.routes');
const eventosRoutes = require('./eventos.routes');
const categoriasRoutes = require('./categorias.routes');
const inscripcionesRoutes = require('./inscripciones.routes');
const kitsRoutes = require('./kits.routes');
const cronometrajeRoutes = require('./cronometraje.routes');
const resultadosRoutes = require('./resultados.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/usuarios', usuariosRoutes);
router.use('/roles', rolesRoutes);
router.use('/eventos', eventosRoutes);
router.use('/categorias', categoriasRoutes);
router.use('/inscripciones', inscripcionesRoutes);
router.use('/kits', kitsRoutes);
router.use('/cronometraje', cronometrajeRoutes);
router.use('/resultados', resultadosRoutes);

module.exports = router;
