'use strict';

const { UniqueConstraintError } = require('sequelize');
const {
  sequelize,
  Inscripcion,
  Categoria,
  Evento,
  Usuario,
  Dorsal,
  TiempoCheckpoint,
  Op
} = require('../models');
const ApiError = require('../utils/ApiError');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const { calcularEdad } = require('../utils/tiempos');

const includeCategoria = {
  model: Categoria,
  as: 'categoria',
  attributes: [
    'id_categoria', 'id_evento', 'nombre_cat', 'distancia_km',
    'cupo_maximo', 'precio', 'edad_minima', 'edad_maxima', 'genero'
  ],
  include: [{
    model: Evento,
    as: 'evento',
    attributes: ['id_evento', 'nombre_evento', 'fecha_evento', 'ciudad', 'lugar_salida', 'estado']
  }]
};

const includeUsuario = {
  model: Usuario,
  as: 'usuario',
  attributes: [
    'id_usuario', 'nombre', 'apellido', 'email', 'telefono',
    'contacto_emergencia', 'genero', 'fecha_nacimiento'
  ]
};

function serializarInscripcion(inscripcion) {
  const plain = inscripcion?.get ? inscripcion.get({ plain: true }) : { ...inscripcion };

  plain.numero_dorsal = plain.dorsal?.numero_dorsal ?? null;
  plain.chip_code = plain.dorsal?.chip_code ?? null;
  plain.estado_kit = plain.dorsal?.estado_kit ?? 'pendiente';

  return plain;
}

function validarElegibilidad(usuario, categoria, evento) {
  const edad = calcularEdad(usuario.fecha_nacimiento, evento.fecha_evento);

  if (categoria.edad_minima !== null || categoria.edad_maxima !== null) {
    if (!usuario.fecha_nacimiento) {
      throw ApiError.unprocessable(
        'Debe registrar su fecha de nacimiento para inscribirse en esta categoria.'
      );
    }
    if (categoria.edad_minima !== null && edad < Number(categoria.edad_minima)) {
      throw ApiError.unprocessable(
        `La categoria requiere una edad minima de ${categoria.edad_minima} anos (edad calculada: ${edad}).`
      );
    }
    if (categoria.edad_maxima !== null && edad > Number(categoria.edad_maxima)) {
      throw ApiError.unprocessable(
        `La categoria permite una edad maxima de ${categoria.edad_maxima} anos (edad calculada: ${edad}).`
      );
    }
  }

  if (categoria.genero !== 'Mixto') {
    if (!usuario.genero) {
      throw ApiError.unprocessable(
        'Debe registrar su genero para inscribirse en esta categoria.'
      );
    }
    if (usuario.genero !== categoria.genero) {
      throw ApiError.unprocessable(
        `La categoria es exclusiva para el genero "${categoria.genero}".`
      );
    }
  }
}

async function obtenerInscripcion(idInscripcion, options = {}) {
  const inscripcion = await Inscripcion.findByPk(idInscripcion, {
    include: [
      includeCategoria,
      includeUsuario,
      {
        model: Dorsal,
        as: 'dorsal',
        include: [{
          model: TiempoCheckpoint,
          as: 'tiempos',
          attributes: ['id_tiempo', 'nombre_punto', 'tiempo_marcado'],
          required: false
        }],
        required: false
      }
    ],
    ...options
  });

  if (!inscripcion) throw ApiError.notFound('Inscripcion no encontrada.');
  return serializarInscripcion(inscripcion);
}

async function asignarDorsalPendiente(idInscripcion, transaction) {
  const existente = await Dorsal.findOne({
    where: { id_inscripcion: idInscripcion },
    transaction,
    lock: transaction.LOCK.UPDATE
  });

  if (existente) return existente;

  const maximo = await Dorsal.max('numero_dorsal', { transaction });
  const numeroDorsal = Math.max(Number(maximo) || 0, 1000) + 1;

  return Dorsal.create({
    id_inscripcion: idInscripcion,
    numero_dorsal: numeroDorsal,
    chip_code: null,
    estado_kit: 'pendiente'
  }, { transaction });
}

async function crearInscripcion(payload, opciones = {}) {
  // La generacion del dorsal puede colisionar bajo concurrencia. Se reintenta
  // la transaccion completa para que el indice unico siga siendo la garantia.
  const maxIntentos = 4;

  for (let intento = 1; intento <= maxIntentos; intento += 1) {
    try {
      return await crearInscripcionTransaccion(payload, opciones);
    } catch (error) {
      if (error instanceof UniqueConstraintError && intento < maxIntentos) {
        continue;
      }
      throw error;
    }
  }

  throw ApiError.conflict('No fue posible asignar un numero de dorsal. Intente nuevamente.');
}

async function crearInscripcionTransaccion(payload, { actor, esAdmin = false } = {}) {
  const idUsuario = esAdmin && payload.id_usuario
    ? Number(payload.id_usuario)
    : Number(actor.id_usuario);

  return sequelize.transaction(async (transaction) => {
    const categoria = await Categoria.findByPk(payload.id_categoria, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!categoria) throw ApiError.notFound('Categoria no encontrada.');

    const evento = await Evento.findByPk(categoria.id_evento, { transaction });
    if (!evento) throw ApiError.notFound('El evento de la categoria no existe.');

    if (evento.estado !== 'publicado') {
      throw ApiError.conflict(
        `El evento se encuentra en estado "${evento.estado}" y no admite inscripciones.`
      );
    }

    const usuario = await Usuario.findByPk(idUsuario, { transaction });
    if (!usuario) throw ApiError.notFound('Usuario no encontrado.');
    if (usuario.estado_cuenta !== 'activo') {
      throw ApiError.conflict('La cuenta del usuario se encuentra inactiva.');
    }

    validarElegibilidad(usuario, categoria, evento);

    const ocupados = await Inscripcion.count({
      where: {
        id_categoria: categoria.id_categoria,
        estado_pago: { [Op.ne]: 'cancelado' }
      },
      transaction
    });

    if (ocupados >= Number(categoria.cupo_maximo)) {
      throw ApiError.conflict(
        'La categoria no tiene cupos disponibles.',
        { cupo_maximo: Number(categoria.cupo_maximo), cupos_ocupados: ocupados }
      );
    }

    const existente = await Inscripcion.findOne({
      where: {
        id_usuario: idUsuario,
        id_categoria: categoria.id_categoria
      },
      transaction
    });

    if (existente && existente.estado_pago !== 'cancelado') {
      throw ApiError.conflict('El usuario ya tiene una inscripcion activa en esta categoria.', {
        id_inscripcion: existente.id_inscripcion,
        estado_pago: existente.estado_pago
      });
    }

    const estadoPago = esAdmin && payload.estado_pago
      ? payload.estado_pago
      : 'pendiente';

    const datos = {
      codigo_transaccion: payload.codigo_transaccion ?? null,
      estado_pago: estadoPago,
      talla_camiseta: payload.talla_camiseta ?? null,
      fecha_inscripcion: new Date()
    };

    let inscripcion;
    if (existente) {
      inscripcion = await existente.update(datos, { transaction });
    } else {
      inscripcion = await Inscripcion.create({
        id_usuario: idUsuario,
        id_categoria: categoria.id_categoria,
        ...datos
      }, { transaction });
    }

    // El dorsal se reserva desde la inscripcion para que el pase digital y el
    // comprobante tengan un numero oficial antes de la entrega del kit.
    await asignarDorsalPendiente(inscripcion.id_inscripcion, transaction);

    return obtenerInscripcion(inscripcion.id_inscripcion, { transaction });
  });
}

async function listarInscripciones(query, { actor, rol } = {}) {
  const { page, limit, offset } = getPagination(query, { defaultLimit: 20, maxLimit: 100 });
  const where = {};

  if (rol === 'corredor') {
    where.id_usuario = actor.id_usuario;
  } else if (query.id_usuario) {
    where.id_usuario = query.id_usuario;
  }

  if (query.estado_pago) where.estado_pago = query.estado_pago;
  if (query.id_categoria) where.id_categoria = query.id_categoria;

  if (query.id_evento) {
    where['$categoria.id_evento$'] = Number(query.id_evento);
  }

  if (query.q) {
    const like = `%${query.q}%`;
    const or = [
      { '$usuario.nombre$': { [Op.like]: like } },
      { '$usuario.apellido$': { [Op.like]: like } },
      { '$usuario.email$': { [Op.like]: like } },
      { '$dorsal.chip_code$': { [Op.like]: like } }
    ];

    if (/^\d+$/.test(String(query.q).trim())) {
      or.push({ '$dorsal.numero_dorsal$': Number(query.q) });
    }

    where[Op.or] = or;
  }

  const { rows, count } = await Inscripcion.findAndCountAll({
    where,
    include: [
      includeCategoria,
      includeUsuario,
      {
        model: Dorsal,
        as: 'dorsal',
        attributes: ['id_dorsal', 'numero_dorsal', 'chip_code', 'estado_kit'],
        required: false
      }
    ],
    order: [['fecha_inscripcion', 'DESC']],
    limit,
    offset,
    distinct: true,
    subQuery: false
  });

  return {
    data: rows.map(serializarInscripcion),
    meta: buildPaginationMeta(count, page, limit)
  };
}

async function actualizarEstadoPago(idInscripcion, estadoPago) {
  if (!['pendiente', 'completado', 'cancelado'].includes(estadoPago)) {
    throw ApiError.unprocessable('Estado de pago invalido.', {
      permitidos: ['pendiente', 'completado', 'cancelado']
    });
  }

  return sequelize.transaction(async (transaction) => {
    const inscripcion = await Inscripcion.findByPk(idInscripcion, {
      include: [{ model: Dorsal, as: 'dorsal', required: false }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!inscripcion) throw ApiError.notFound('Inscripcion no encontrada.');

    if (
      estadoPago === 'cancelado' &&
      inscripcion.dorsal?.estado_kit === 'entregado'
    ) {
      throw ApiError.conflict(
        'No se puede cancelar una inscripcion cuyo kit ya fue entregado.'
      );
    }

    await inscripcion.update({ estado_pago: estadoPago }, { transaction });
    return obtenerInscripcion(inscripcion.id_inscripcion, { transaction });
  });
}

/**
 * Pago simulado para el flujo de demostracion del frontend. No reemplaza la
 * pasarela real: solo el propietario (o un admin) puede completar el pago.
 */
async function registrarPagoSimulado(idInscripcion, { actor, rol }, payload = {}) {
  const inscripcion = await Inscripcion.findByPk(idInscripcion);
  if (!inscripcion) throw ApiError.notFound('Inscripcion no encontrada.');

  if (rol === 'corredor' && Number(inscripcion.id_usuario) !== Number(actor.id_usuario)) {
    throw ApiError.forbidden('Solo puede pagar sus propias inscripciones.');
  }

  if (inscripcion.estado_pago === 'cancelado') {
    throw ApiError.conflict('La inscripcion esta cancelada y no admite pagos.');
  }

  if (inscripcion.estado_pago === 'completado') {
    return { ...(await obtenerInscripcion(idInscripcion)), pago_simulado: true, ya_pagado: true };
  }

  const codigo = payload.codigo_transaccion
    ? String(payload.codigo_transaccion).slice(0, 100)
    : `SIM-${Date.now().toString(36).toUpperCase()}-${idInscripcion}`;

  await inscripcion.update({
    codigo_transaccion: codigo,
    estado_pago: 'completado'
  });

  return {
    ...(await obtenerInscripcion(idInscripcion)),
    pago_simulado: true,
    metodo_pago: payload.metodo_pago || 'tarjeta_simulada'
  };
}

async function cancelarInscripcion(idInscripcion, { actor, rol }) {
  const inscripcion = await Inscripcion.findByPk(idInscripcion, {
    include: [{ model: Dorsal, as: 'dorsal', required: false }]
  });

  if (!inscripcion) throw ApiError.notFound('Inscripcion no encontrada.');

  if (rol === 'corredor' && Number(inscripcion.id_usuario) !== Number(actor.id_usuario)) {
    throw ApiError.forbidden('Solo puede cancelar sus propias inscripciones.');
  }

  if (inscripcion.estado_pago === 'cancelado') {
    throw ApiError.conflict('La inscripcion ya se encuentra cancelada.');
  }

  if (inscripcion.dorsal?.estado_kit === 'entregado') {
    throw ApiError.conflict('No se puede cancelar una inscripcion con kit entregado.');
  }

  return actualizarEstadoPago(idInscripcion, 'cancelado');
}

async function verificarAccesoInscripcion(inscripcion, { actor, rol }) {
  if (rol !== 'corredor') return;
  if (Number(inscripcion.id_usuario) !== Number(actor.id_usuario)) {
    throw ApiError.forbidden('No tiene acceso a esta inscripcion.');
  }
}

module.exports = {
  crearInscripcion,
  listarInscripciones,
  obtenerInscripcion,
  actualizarEstadoPago,
  registrarPagoSimulado,
  cancelarInscripcion,
  verificarAccesoInscripcion,
  serializarInscripcion
};
