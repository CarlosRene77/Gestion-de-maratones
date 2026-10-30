'use strict';

const {
  TiempoCheckpoint,
  Dorsal,
  Inscripcion,
  Categoria,
  Evento,
  Usuario,
  Op
} = require('../models');
const ApiError = require('../utils/ApiError');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { normalizarPunto, calcularTiempos } = require('../utils/tiempos');

const includeInscripcion = {
  model: Inscripcion,
  as: 'inscripcion',
  required: true,
  attributes: ['id_inscripcion', 'id_usuario', 'id_categoria', 'estado_pago'],
  include: [
    {
      model: Categoria,
      as: 'categoria',
      required: true,
      attributes: ['id_categoria', 'id_evento', 'nombre_cat', 'distancia_km', 'genero'],
      include: [{
        model: Evento,
        as: 'evento',
        required: true,
        attributes: ['id_evento', 'nombre_evento', 'fecha_evento', 'ciudad', 'estado']
      }]
    },
    {
      model: Usuario,
      as: 'usuario',
      required: true,
      attributes: ['id_usuario', 'nombre', 'apellido', 'genero']
    }
  ]
};

const includeDorsal = {
  model: Dorsal,
  as: 'dorsal',
  required: true,
  attributes: ['id_dorsal', 'numero_dorsal', 'chip_code', 'estado_kit'],
  include: [includeInscripcion]
};

function contextoDorsal(dorsal) {
  const inscripcion = dorsal.inscripcion;
  return {
    id_dorsal: dorsal.id_dorsal,
    numero_dorsal: dorsal.numero_dorsal,
    chip_code: dorsal.chip_code,
    id_inscripcion: inscripcion.id_inscripcion,
    corredor: {
      id_usuario: inscripcion.usuario.id_usuario,
      nombre: inscripcion.usuario.nombre,
      apellido: inscripcion.usuario.apellido,
      genero: inscripcion.usuario.genero
    },
    categoria: {
      id_categoria: inscripcion.categoria.id_categoria,
      nombre_cat: inscripcion.categoria.nombre_cat,
      distancia_km: Number(inscripcion.categoria.distancia_km),
      genero: inscripcion.categoria.genero
    },
    evento: inscripcion.categoria.evento
  };
}

async function buscarDorsal({ id_dorsal, numero_dorsal }, options = {}) {
  const where = id_dorsal ? { id_dorsal } : { numero_dorsal };
  const dorsal = await Dorsal.findOne({
    where,
    include: [includeInscripcion],
    ...options
  });

  if (!dorsal) {
    throw ApiError.notFound('Dorsal no encontrado.');
  }

  return dorsal;
}

async function marcarTiempo(payload, idStaff) {
  const punto = normalizarPunto(payload.nombre_punto);
  if (!punto) throw ApiError.unprocessable('El nombre del punto es obligatorio.');

  const dorsal = await buscarDorsal(payload);

  if (dorsal.inscripcion.estado_pago !== 'completado') {
    throw ApiError.conflict(
      'No se pueden registrar tiempos de una inscripcion sin pago completado.'
    );
  }

  if (
    payload.id_evento &&
    Number(payload.id_evento) !== Number(dorsal.inscripcion.categoria.id_evento)
  ) {
    throw ApiError.conflict('El dorsal no pertenece al evento indicado.');
  }

  const fecha = payload.tiempo_marcado ? new Date(payload.tiempo_marcado) : new Date();
  if (Number.isNaN(fecha.getTime())) {
    throw ApiError.unprocessable('La fecha/hora de marcacion no es valida.');
  }

  const existente = await TiempoCheckpoint.findOne({
    where: { id_dorsal: dorsal.id_dorsal, nombre_punto: punto }
  });

  if (existente) {
    throw ApiError.conflict(
      `El dorsal ${dorsal.numero_dorsal} ya tiene una marcacion en "${punto}".`,
      { id_tiempo: existente.id_tiempo, tiempo_marcado: existente.tiempo_marcado }
    );
  }

  const marcacion = await TiempoCheckpoint.create({
    id_dorsal: dorsal.id_dorsal,
    nombre_punto: punto,
    tiempo_marcado: fecha,
    id_staff_registro: idStaff
  });

  const tiempos = await TiempoCheckpoint.findAll({
    where: { id_dorsal: dorsal.id_dorsal },
    attributes: ['id_tiempo', 'nombre_punto', 'tiempo_marcado'],
    order: [['tiempo_marcado', 'ASC']]
  });

  return {
    id_tiempo: marcacion.id_tiempo,
    id_dorsal: dorsal.id_dorsal,
    numero_dorsal: dorsal.numero_dorsal,
    nombre_punto: marcacion.nombre_punto,
    tiempo_marcado: marcacion.tiempo_marcado,
    id_staff_registro: marcacion.id_staff_registro,
    ...contextoDorsal(dorsal),
    calculo: calcularTiempos(tiempos)
  };
}

async function listarMarcaciones(idEvento, query) {
  const { page, limit, offset } = getPagination(query, { defaultLimit: 50, maxLimit: 200 });
  const where = {
    '$dorsal.inscripcion.categoria.id_evento$': Number(idEvento)
  };

  if (query.punto) {
    where.nombre_punto = normalizarPunto(query.punto);
  }

  if (query.desde || query.hasta) {
    where.tiempo_marcado = {};
    if (query.desde) where.tiempo_marcado[Op.gte] = new Date(query.desde);
    if (query.hasta) where.tiempo_marcado[Op.lte] = new Date(query.hasta);
  }

  if (query.numero_dorsal) {
    where['$dorsal.numero_dorsal$'] = Number(query.numero_dorsal);
  }

  if (query.id_categoria) {
    where['$dorsal.inscripcion.categoria.id_categoria$'] = Number(query.id_categoria);
  }

  const { rows, count } = await TiempoCheckpoint.findAndCountAll({
    where,
    include: [includeDorsal],
    order: [['tiempo_marcado', 'DESC']],
    limit,
    offset,
    distinct: true,
    subQuery: false
  });

  return {
    data: rows.map((row) => ({
      id_tiempo: row.id_tiempo,
      nombre_punto: row.nombre_punto,
      tiempo_marcado: row.tiempo_marcado,
      id_staff_registro: row.id_staff_registro,
      ...contextoDorsal(row.dorsal)
    })),
    meta: buildPaginationMeta(count, page, limit)
  };
}

async function obtenerMarcacionesPorDorsal(idDorsal) {
  const dorsal = await buscarDorsal({ id_dorsal: idDorsal });

  const tiempos = await TiempoCheckpoint.findAll({
    where: { id_dorsal: dorsal.id_dorsal },
    attributes: ['id_tiempo', 'nombre_punto', 'tiempo_marcado', 'id_staff_registro'],
    order: [['tiempo_marcado', 'ASC']]
  });

  return {
    ...contextoDorsal(dorsal),
    total_marcaciones: tiempos.length,
    ...calcularTiempos(tiempos)
  };
}

async function actualizarMarcacion(idTiempo, payload) {
  const marcacion = await TiempoCheckpoint.findByPk(idTiempo, { include: [includeDorsal] });
  if (!marcacion) throw ApiError.notFound('Marcacion no encontrada.');

  const nuevoPunto = payload.nombre_punto !== undefined
    ? normalizarPunto(payload.nombre_punto)
    : marcacion.nombre_punto;

  if (!nuevoPunto) throw ApiError.unprocessable('El nombre del punto es obligatorio.');

  if (nuevoPunto !== marcacion.nombre_punto) {
    const duplicado = await TiempoCheckpoint.findOne({
      where: {
        id_dorsal: marcacion.id_dorsal,
        nombre_punto: nuevoPunto,
        id_tiempo: { [Op.ne]: marcacion.id_tiempo }
      }
    });
    if (duplicado) {
      throw ApiError.conflict(
        `El dorsal ya tiene una marcacion en "${nuevoPunto}".`
      );
    }
  }

  const fecha = payload.tiempo_marcado
    ? new Date(payload.tiempo_marcado)
    : marcacion.tiempo_marcado;

  if (Number.isNaN(new Date(fecha).getTime())) {
    throw ApiError.unprocessable('La fecha/hora de marcacion no es valida.');
  }

  marcacion.nombre_punto = nuevoPunto;
  marcacion.tiempo_marcado = fecha;
  await marcacion.save();

  const tiempos = await TiempoCheckpoint.findAll({
    where: { id_dorsal: marcacion.id_dorsal },
    attributes: ['id_tiempo', 'nombre_punto', 'tiempo_marcado'],
    order: [['tiempo_marcado', 'ASC']]
  });

  return {
    id_tiempo: marcacion.id_tiempo,
    id_dorsal: marcacion.id_dorsal,
    numero_dorsal: marcacion.dorsal.numero_dorsal,
    nombre_punto: marcacion.nombre_punto,
    tiempo_marcado: marcacion.tiempo_marcado,
    calculo: calcularTiempos(tiempos)
  };
}

async function eliminarMarcacion(idTiempo) {
  const marcacion = await TiempoCheckpoint.findByPk(idTiempo);
  if (!marcacion) throw ApiError.notFound('Marcacion no encontrada.');

  await marcacion.destroy();
  return { id_tiempo: Number(idTiempo) };
}

module.exports = {
  marcarTiempo,
  listarMarcaciones,
  obtenerMarcacionesPorDorsal,
  actualizarMarcacion,
  eliminarMarcacion
};
