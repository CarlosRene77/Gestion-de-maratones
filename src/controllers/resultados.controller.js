'use strict';

const resultadosService = require('../services/resultados.service');

function esAdmin(req) {
  return ['admin', 'staff'].includes(req.rol);
}

async function porEvento(req, res) {
  const data = await resultadosService.obtenerResultadosEvento(
    req.params.idEvento,
    req.query,
    { esAdmin: esAdmin(req) }
  );
  return res.success(data, 'Resultados del evento obtenidos correctamente.');
}

async function porCategoria(req, res) {
  const data = await resultadosService.obtenerResultadosCategoria(
    req.params.idCategoria,
    req.query,
    { esAdmin: esAdmin(req) }
  );
  return res.success(data, 'Resultados de la categoria obtenidos correctamente.');
}

async function porDorsal(req, res) {
  const data = await resultadosService.obtenerResultadoDorsal(req.params.numeroDorsal);
  return res.success(data, 'Resultado del dorsal obtenido correctamente.');
}

async function certificado(req, res) {
  const data = await resultadosService.obtenerCertificado(req.params.numeroDorsal);
  return res.success(data, 'Datos del certificado digital generados correctamente.');
}

module.exports = { porEvento, porCategoria, porDorsal, certificado };
