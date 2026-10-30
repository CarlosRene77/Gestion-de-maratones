'use strict';

const { UniqueConstraintError } = require('sequelize');
const {
  sequelize,
  Inscripcion,
  Categoria,
  Evento,
  Usuario,
  Dorsal,
  Op
} = require('../models');
const ApiError = require('../utils/ApiError');
const { getPagination, buildPaginationMeta } = require('../utils/pagination');
const {
  obtenerInscripcion,
  serializarInscripcion
} = require('./inscripciones.service');

const includeDorsal = {
  model: Dorsal,
  as: 'dorsal',
  attributes: ['id_dorsal', 'id_inscripcion', 'numero_dorsal', 'chip_code', 'estado_kit'],
  required: false
};

async function entregarKit(payload, idStaff) {
  const maxIntentos = 4;

  for (let intento = 1; intento <= maxIntentos; intento += 1) {
    try {
      return await sequelize.transaction(async (transaction) => {
        const inscripcion = await Inscripcion.findByPk(payload.id_inscripcion, {
          include: [{
            model: Categoria,
            as: 'categoria',
            attributes: ['id_categoria', 'id_evento', 'nombre_cat', 'precio']
          }, includeDorsal],
          transaction,
          lock: transaction.LOCK.UPDATE
        });

        if (!inscripcion) throw ApiError.notFound('Inscripcion no encontrada.');

        if (inscripcion.estado_pago !== 'completado') {
          throw ApiError.conflict(
            'Solo se puede entregar el kit cuando el pago esta completado.',
            { estado_pago: inscripcion.estado_pago }
          );
        }

        if (inscripcion.dorsal?.estado_kit === 'entregado') {
          throw ApiError.conflict('El kit de esta inscripcion ya fue entregado.', {
            id_dorsal: inscripcion.dorsal.id_dorsal,
            numero_dorsal: inscripcion.dorsal.numero_dorsal
          });
        }

        let numeroDorsal = payload.numero_dorsal !== undefined && payload.numero_dorsal !== null
          ? Number(payload.numero_dorsal)
          : null;

        if (numeroDorsal !== null) {
          const numeroOcupado = await Dorsal.findOne({
            where: {
              numero_dorsal: numeroDorsal,
              id_inscripcion: { [Op.ne]: inscripcion.id_inscripcion }
            },
            transaction
          });
          if (numeroOcupado) {
            throw ApiError.conflict(`El numero de dorsal ${numeroDorsal} ya esta asignado.`);
          }
        } else if (inscripcion.dorsal) {
          numeroDorsal = Number(inscripcion.dorsal.numero_dorsal);
        } else {
          const maximo = await Dorsal.max('numero_dorsal', { transaction });
          // Los dorsales publicos inician en 1001 para distinguirlos de ids internos.
          numeroDorsal = Math.max(Number(maximo) || 0, 1000) + 1;
        }

        const chipCode = payload.chip_code
          ? String(payload.chip_code).trim()
          : (inscripcion.dorsal?.chip_code ?? null);

        if (chipCode) {
          const chipOcupado = await Dorsal.findOne({
            where: {
              chip_code: chipCode,
              id_inscripcion: { [Op.ne]: inscripcion.id_inscripcion }
            },
            transaction
          });
          if (chipOcupado) {
            throw ApiError.conflict(`El chip "${chipCode}" ya esta asignado a otro dorsal.`);
          }
        }

        const datosDorsal = {
          numero_dorsal: numeroDorsal,
          chip_code: chipCode || null,
          estado_kit: 'entregado'
        };

        let dorsal;
        if (inscripcion.dorsal) {
          dorsal = await inscripcion.dorsal.update(datosDorsal, { transaction });
        } else {
          dorsal = await Dorsal.create({
            id_inscripcion: inscripcion.id_inscripcion,
            ...datosDorsal
          }, { transaction });
        }

        const resultado = await obtenerInscripcion(inscripcion.id_inscripcion, { transaction });
        resultado.entregado_por = idStaff;
        return resultado;
      });
    } catch (error) {
      const esColision = error instanceof UniqueConstraintError;
      if (esColision && intento < maxIntentos && payload.numero_dorsal == null) {
        continue;
      }
      if (esColision) {
        throw ApiError.conflict('El numero de dorsal o chip ya esta asignado.');
      }
      throw error;
    }
  }

  throw ApiError.conflict('No fue posible asignar un numero de dorsal. Intente nuevamente.');
}

async function listarKits(query) {
  const { page, limit, offset } = getPagination(query, { defaultLimit: 20, maxLimit: 100 });
  const where = { estado_pago: 'completado' };

  if (query.id_evento) {
    where['$categoria.id_evento$'] = Number(query.id_evento);
  }

  if (query.id_categoria) {
    where.id_categoria = Number(query.id_categoria);
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

  if (query.estado_kit === 'entregado') {
    where['$dorsal.estado_kit$'] = 'entregado';
  } else if (query.estado_kit === 'pendiente') {
    where[Op.and] = [
      ...(where[Op.and] || []),
      {
        [Op.or]: [
          { '$dorsal.id_dorsal$': null },
          { '$dorsal.estado_kit$': { [Op.ne]: 'entregado' } }
        ]
      }
    ];
  }

  const { rows, count } = await Inscripcion.findAndCountAll({
    where,
    include: [
      {
        model: Categoria,
        as: 'categoria',
        attributes: ['id_categoria', 'id_evento', 'nombre_cat', 'distancia_km', 'genero'],
        include: [{
          model: Evento,
          as: 'evento',
          attributes: ['id_evento', 'nombre_evento', 'fecha_evento', 'ciudad']
        }]
      },
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['id_usuario', 'nombre', 'apellido', 'email', 'telefono', 'genero']
      },
      {
        ...includeDorsal,
        required: query.estado_kit === 'entregado'
      }
    ],
    order: [['fecha_inscripcion', 'ASC']],
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

async function obtenerKit(idInscripcion) {
  const inscripcion = await obtenerInscripcion(idInscripcion);
  if (inscripcion.estado_pago !== 'completado') {
    throw ApiError.conflict('La inscripcion no registra pago completado.');
  }
  return inscripcion;
}

module.exports = {
  entregarKit,
  listarKits,
  obtenerKit
};
