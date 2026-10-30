'use strict';

const inscripcionesService = require('../services/inscripciones.service');

async function crear(req, res) {
  const data = await inscripcionesService.crearInscripcion(req.body, {
    actor: req.user,
    esAdmin: req.rol === 'admin'
  });
  return res.created(data, 'Inscripcion registrada correctamente.');
}

async function listar(req, res) {
  const { data, meta } = await inscripcionesService.listarInscripciones(req.query, {
    actor: req.user,
    rol: req.rol
  });
  return res.success(data, 'Inscripciones obtenidas correctamente.', meta);
}

async function obtener(req, res) {
  const data = await inscripcionesService.obtenerInscripcion(req.params.id);
  await inscripcionesService.verificarAccesoInscripcion(data, {
    actor: req.user,
    rol: req.rol
  });
  return res.success(data, 'Inscripcion obtenida correctamente.');
}

async function cambiarEstadoPago(req, res) {
  const data = await inscripcionesService.actualizarEstadoPago(
    req.params.id,
    req.body.estado_pago
  );
  return res.success(data, 'Estado de pago actualizado correctamente.');
}

async function pagoSimulado(req, res) {
  const data = await inscripcionesService.registrarPagoSimulado(
    req.params.id,
    { actor: req.user, rol: req.rol },
    req.body
  );
  return res.success(data, 'Pago simulado registrado correctamente.');
}

async function cancelar(req, res) {
  const data = await inscripcionesService.cancelarInscripcion(req.params.id, {
    actor: req.user,
    rol: req.rol
  });
  return res.success(data, 'Inscripcion cancelada correctamente.');
}

module.exports = { crear, listar, obtener, cambiarEstadoPago, pagoSimulado, cancelar };
