'use strict';

process.env.NODE_ENV = 'test';
process.env.DB_DIALECT = 'sqlite';
process.env.DB_STORAGE = ':memory:';
process.env.DB_SYNC = 'true';
process.env.JWT_SECRET = 'test_secret_marathonhub';
process.env.SEED_ON_START = 'false';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../src/app');
const { connectDatabase, closeDatabase } = require('../src/config/database');
const { seedBase } = require('../src/seeders');
const openapi = require('../src/docs/openapi');

const estado = {
  adminToken: null,
  corredorToken: null,
  staffToken: null,
  idEvento: null,
  idCategoria10k: null,
  idCategoriaFemenil: null,
  idCategoriaCupoUnico: null,
  idInscripcion: null,
  numeroDorsal: null,
  idTiempo: null
};

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

before(async () => {
  await connectDatabase();
  await seedBase({ silent: true });
});

after(async () => {
  await closeDatabase();
});

test('MarathonHub API - flujo integral', async (t) => {
  await t.test('health responde con sobre estandar y tema', async () => {
    const res = await request(app).get('/health').expect(200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.estado, 'ok');
    assert.equal(res.body.tema.modo_oscuro, false);
  });

  await t.test('la documentacion OpenAPI esta disponible', async () => {
    const res = await request(app).get('/api-docs.json').expect(200);
    assert.equal(res.body.openapi, '3.0.3');
    assert.ok(res.body.paths['/api/auth/login']);
    assert.ok(openapi.components.securitySchemes.bearerAuth);
  });

  await t.test('login de admin y lectura de perfil', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@marathonhub.com', password: 'Admin123!' })
      .expect(200);

    assert.equal(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.equal(res.body.data.usuario.rol.nombre_rol, 'admin');
    assert.equal(res.body.tema.modo_oscuro, false);
    assert.equal(res.body.data.usuario.password_hash, undefined);

    estado.adminToken = res.body.data.token;

    const me = await request(app)
      .get('/api/auth/me')
      .set(auth(estado.adminToken))
      .expect(200);

    assert.equal(me.body.data.email, 'admin@marathonhub.com');
  });

  await t.test('registro de corredor, validaciones y duplicados', async () => {
    const payload = {
      nombre: 'Carla',
      apellido: 'Velocidad',
      email: 'carla@example.com',
      password: 'Corredor123!',
      fecha_nacimiento: '1993-03-15',
      genero: 'F',
      telefono: '+507 6000-1234',
      ficha_medica_json: { tipo_sangre: 'O+', alergias: [] }
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(payload)
      .expect(201);

    assert.ok(res.body.data.token);
    assert.equal(res.body.data.usuario.email, 'carla@example.com');
    assert.equal(res.body.data.usuario.estado_cuenta, 'activo');
    estado.corredorToken = res.body.data.token;

    await request(app)
      .post('/api/auth/register')
      .send(payload)
      .expect(409);

    const invalido = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'X', email: 'no-es-email', password: '123' })
      .expect(422);

    assert.equal(invalido.body.success, false);
    assert.equal(invalido.body.error.code, 'VALIDATION_ERROR');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'carla@example.com', password: 'Corredor123!' })
      .expect(200);

    assert.equal(login.body.tema.modo_oscuro, false);
  });

  await t.test('preferencia de modo oscuro se persiste y se devuelve', async () => {
    const res = await request(app)
      .put('/api/auth/preferencias')
      .set(auth(estado.corredorToken))
      .send({ modo_oscuro_pref: true })
      .expect(200);

    assert.equal(res.body.data.modo_oscuro_pref, true);
    assert.equal(res.body.tema.modo_oscuro, true);

    const me = await request(app)
      .get('/api/auth/me')
      .set(auth(estado.corredorToken))
      .expect(200);

    assert.equal(me.body.data.modo_oscuro_pref, true);
    assert.equal(me.body.tema.modo_oscuro, true);
  });

  await t.test('RBAC: corredor no puede crear eventos y anonimo recibe 401', async () => {
    await request(app)
      .post('/api/eventos')
      .set(auth(estado.corredorToken))
      .send({ nombre_evento: 'No permitido', fecha_evento: '2026-12-01T10:00:00.000Z' })
      .expect(403);

    await request(app)
      .post('/api/eventos')
      .send({ nombre_evento: 'No autenticado', fecha_evento: '2026-12-01T10:00:00.000Z' })
      .expect(401);
  });

  await t.test('admin crea staff y usuario extra', async () => {
    const staff = await request(app)
      .post('/api/usuarios')
      .set(auth(estado.adminToken))
      .send({
        nombre: 'Elena',
        apellido: 'Cronos',
        email: 'elena.staff@example.com',
        password: 'Staff123!',
        rol: 'staff'
      })
      .expect(201);

    assert.equal(staff.body.data.rol.nombre_rol, 'staff');

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'elena.staff@example.com', password: 'Staff123!' })
      .expect(200);
    estado.staffToken = login.body.data.token;

    await request(app)
      .post('/api/usuarios')
      .set(auth(estado.adminToken))
      .send({
        nombre: 'Bruno',
        apellido: 'Segundo',
        email: 'bruno@example.com',
        password: 'Corredor123!',
        rol: 'corredor',
        fecha_nacimiento: '1990-06-10',
        genero: 'M'
      })
      .expect(201);
  });

  await t.test('admin crea evento y categorias con cupos', async () => {
    const evento = await request(app)
      .post('/api/eventos')
      .set(auth(estado.adminToken))
      .send({
        nombre_evento: 'Media Maraton de Prueba 2026',
        descripcion: 'Evento de integracion',
        fecha_evento: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        ciudad: 'Ciudad de Panama',
        lugar_salida: 'Cinta Costera',
        estado: 'publicado'
      })
      .expect(201);

    estado.idEvento = evento.body.data.id_evento;

    const cat10k = await request(app)
      .post(`/api/eventos/${estado.idEvento}/categorias`)
      .set(auth(estado.adminToken))
      .send({
        nombre_cat: '10K Libre',
        distancia_km: 10,
        cupo_maximo: 2,
        precio: 25,
        edad_minima: 18,
        edad_maxima: 99,
        genero: 'Mixto'
      })
      .expect(201);

    assert.equal(cat10k.body.data.cupos_disponibles, 2);
    estado.idCategoria10k = cat10k.body.data.id_categoria;

    const femenil = await request(app)
      .post(`/api/eventos/${estado.idEvento}/categorias`)
      .set(auth(estado.adminToken))
      .send({
        nombre_cat: '5K Femenil',
        distancia_km: 5,
        cupo_maximo: 1,
        precio: 15,
        edad_minima: 15,
        edad_maxima: 99,
        genero: 'F'
      })
      .expect(201);
    estado.idCategoriaFemenil = femenil.body.data.id_categoria;

    const cupoUnico = await request(app)
      .post(`/api/eventos/${estado.idEvento}/categorias`)
      .set(auth(estado.adminToken))
      .send({
        nombre_cat: '5K Mixto Cupo Unico',
        distancia_km: 5,
        cupo_maximo: 1,
        precio: 10,
        genero: 'Mixto'
      })
      .expect(201);
    estado.idCategoriaCupoUnico = cupoUnico.body.data.id_categoria;

    const detalle = await request(app)
      .get(`/api/eventos/${estado.idEvento}`)
      .expect(200);

    assert.equal(detalle.body.data.categorias.length, 3);
    const femenilDetalle = detalle.body.data.categorias.find(
      (c) => c.id_categoria === estado.idCategoriaFemenil
    );
    assert.equal(femenilDetalle.cupos_disponibles, 1);
  });

  await t.test('listado publico de eventos y filtros', async () => {
    const res = await request(app)
      .get('/api/eventos')
      .query({ estado: 'publicado', page: 1, limit: 10 })
      .expect(200);

    assert.ok(res.body.data.length >= 1);
    assert.equal(res.body.meta.page, 1);
    assert.ok(Array.isArray(res.body.data[0].categorias));

    await request(app)
      .get('/api/eventos')
      .query({ estado: 'inexistente' })
      .expect(422);

    const ordenado = await request(app)
      .get('/api/eventos')
      .query({ sort: 'created_at', order: 'desc' })
      .expect(200);

    assert.ok(Array.isArray(ordenado.body.data));
  });

  await t.test('inscripcion valida cupo, genero y duplicados', async () => {
    const res = await request(app)
      .post('/api/inscripciones')
      .set(auth(estado.corredorToken))
      .send({ id_categoria: estado.idCategoria10k, talla_camiseta: 'M' })
      .expect(201);

    assert.equal(res.body.data.estado_pago, 'pendiente');
    assert.equal(res.body.data.estado_kit, 'pendiente');
    assert.equal(res.body.tema.modo_oscuro, true);
    estado.idInscripcion = res.body.data.id_inscripcion;

    await request(app)
      .post('/api/inscripciones')
      .set(auth(estado.corredorToken))
      .send({ id_categoria: estado.idCategoria10k })
      .expect(409);

    const listado = await request(app)
      .get('/api/inscripciones')
      .set(auth(estado.corredorToken))
      .expect(200);

    assert.equal(listado.body.data.length, 1);
    assert.equal(listado.body.data[0].id_inscripcion, estado.idInscripcion);
  });

  await t.test('admin confirma el pago', async () => {
    const res = await request(app)
      .patch(`/api/inscripciones/${estado.idInscripcion}/pago`)
      .set(auth(estado.adminToken))
      .send({ estado_pago: 'completado' })
      .expect(200);

    assert.equal(res.body.data.estado_pago, 'completado');
  });

  await t.test('staff entrega kit y el dorsal se asigna automaticamente', async () => {
    const res = await request(app)
      .put('/api/kits/entregar')
      .set(auth(estado.staffToken))
      .send({ id_inscripcion: estado.idInscripcion })
      .expect(200);

    assert.equal(res.body.data.estado_kit, 'entregado');
    assert.ok(res.body.data.numero_dorsal >= 1001);
    estado.numeroDorsal = res.body.data.numero_dorsal;

    await request(app)
      .put('/api/kits/entregar')
      .set(auth(estado.staffToken))
      .send({ id_inscripcion: estado.idInscripcion })
      .expect(409);

    await request(app)
      .put('/api/kits/entregar')
      .set(auth(estado.corredorToken))
      .send({ id_inscripcion: estado.idInscripcion })
      .expect(403);
  });

  await t.test('staff registra checkpoints y calcula tiempo neto', async () => {
    const salida = new Date(Date.now() - 60 * 60 * 1000);
    const km5 = new Date(salida.getTime() + 25 * 60 * 1000);
    const meta = new Date(salida.getTime() + 50 * 60 * 1000);

    for (const [punto, fecha] of [['SALIDA', salida], ['KM 5', km5], ['META', meta]]) {
      const res = await request(app)
        .post('/api/cronometraje/marcar')
        .set(auth(estado.staffToken))
        .send({
          numero_dorsal: estado.numeroDorsal,
          nombre_punto: punto,
          tiempo_marcado: fecha.toISOString()
        })
        .expect(201);

      if (punto === 'META') {
        assert.equal(res.body.data.calculo.tiempo_neto, '00:50:00');
        assert.equal(res.body.data.calculo.tiempo_neto_segundos, 3000);
        estado.idTiempo = res.body.data.id_tiempo;
      }
    }

    await request(app)
      .post('/api/cronometraje/marcar')
      .set(auth(estado.staffToken))
      .send({ numero_dorsal: estado.numeroDorsal, nombre_punto: 'META' })
      .expect(409);
  });

  await t.test('resultados publicos y certificado digital', async () => {
    const resultados = await request(app)
      .get(`/api/resultados/evento/${estado.idEvento}`)
      .expect(200);

    const categoria = resultados.body.data.categorias.find(
      (c) => c.id_categoria === estado.idCategoria10k
    );

    assert.equal(categoria.finalizados, 1);
    assert.equal(categoria.resultados[0].posicion, 1);
    assert.equal(categoria.resultados[0].tiempo_neto, '00:50:00');
    assert.equal(resultados.body.tema.modo_oscuro, false);

    const porDorsal = await request(app)
      .get(`/api/resultados/dorsal/${estado.numeroDorsal}`)
      .expect(200);

    assert.equal(porDorsal.body.data.tiempo_neto_segundos, 3000);
    assert.equal(porDorsal.body.data.total_marcaciones, 3);

    const certificado = await request(app)
      .get(`/api/resultados/certificado/${estado.numeroDorsal}`)
      .expect(200);

    assert.equal(certificado.body.data.tiempo_neto, '00:50:00');
    assert.equal(certificado.body.data.posicion_categoria, 1);
    assert.ok(certificado.body.data.codigo_verificacion);
  });

  await t.test('cronometraje en vivo y correcciones de admin', async () => {
    const feed = await request(app)
      .get(`/api/cronometraje/evento/${estado.idEvento}`)
      .expect(200);

    assert.equal(feed.body.meta.total, 3);

    const actualizado = await request(app)
      .put(`/api/cronometraje/${estado.idTiempo}`)
      .set(auth(estado.adminToken))
      .send({ tiempo_marcado: new Date(new Date().getTime() - 60 * 60 * 1000 + 51 * 60 * 1000).toISOString() })
      .expect(200);

    assert.equal(actualizado.body.data.calculo.tiempo_neto, '00:51:00');

    await request(app)
      .delete(`/api/cronometraje/${estado.idTiempo}`)
      .set(auth(estado.staffToken))
      .expect(403);
  });

  await t.test('estadisticas del evento', async () => {
    const res = await request(app)
      .get(`/api/eventos/${estado.idEvento}/estadisticas`)
      .set(auth(estado.adminToken))
      .expect(200);

    assert.equal(res.body.data.recaudado, 25);
    assert.equal(res.body.data.kits.entregado, 1);
    assert.equal(res.body.data.inscripciones.completado, 1);
    assert.equal(res.body.data.marcaciones_registradas, 3);
  });

  await t.test('validacion de genero en categoria exclusiva', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bruno@example.com', password: 'Corredor123!' })
      .expect(200);

    const res = await request(app)
      .post('/api/inscripciones')
      .set(auth(login.body.data.token))
      .send({ id_categoria: estado.idCategoriaFemenil })
      .expect(422);

    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  await t.test('cupo unico: segunda inscripcion rechazada y liberada al cancelar', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bruno@example.com', password: 'Corredor123!' })
      .expect(200);
    const brunoToken = login.body.data.token;

    const primera = await request(app)
      .post('/api/inscripciones')
      .set(auth(estado.corredorToken))
      .send({ id_categoria: estado.idCategoriaCupoUnico })
      .expect(201);

    await request(app)
      .post('/api/inscripciones')
      .set(auth(brunoToken))
      .send({ id_categoria: estado.idCategoriaCupoUnico })
      .expect(409);

    await request(app)
      .delete(`/api/inscripciones/${primera.body.data.id_inscripcion}`)
      .set(auth(estado.corredorToken))
      .expect(200);

    await request(app)
      .post('/api/inscripciones')
      .set(auth(brunoToken))
      .send({ id_categoria: estado.idCategoriaCupoUnico })
      .expect(201);
  });

  await t.test('valida edad y filtra kits por estado', async () => {
    await request(app)
      .post('/api/usuarios')
      .set(auth(estado.adminToken))
      .send({
        nombre: 'Nino',
        apellido: 'Prueba',
        email: 'nino@example.com',
        password: 'Corredor123!',
        rol: 'corredor',
        fecha_nacimiento: '2015-01-15',
        genero: 'M'
      })
      .expect(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nino@example.com', password: 'Corredor123!' })
      .expect(200);

    const fueraDeRango = await request(app)
      .post('/api/inscripciones')
      .set(auth(login.body.data.token))
      .send({ id_categoria: estado.idCategoria10k })
      .expect(422);

    assert.equal(fueraDeRango.body.error.code, 'VALIDATION_ERROR');
    assert.match(fueraDeRango.body.message, /edad minima/i);

    const entregados = await request(app)
      .get('/api/kits')
      .query({ estado_kit: 'entregado', id_evento: estado.idEvento })
      .set(auth(estado.staffToken))
      .expect(200);

    assert.equal(entregados.body.meta.total, 1);
    assert.equal(entregados.body.data[0].estado_kit, 'entregado');

    const pendientes = await request(app)
      .get('/api/kits')
      .query({ estado_kit: 'pendiente', id_evento: estado.idEvento })
      .set(auth(estado.staffToken))
      .expect(200);

    assert.equal(pendientes.body.meta.total, 0);

    const paginado = await request(app)
      .get('/api/kits')
      .query({ page: 1, limit: 1 })
      .set(auth(estado.staffToken))
      .expect(200);

    assert.equal(paginado.body.meta.page, 1);
    assert.equal(paginado.body.meta.limit, 1);
    assert.equal(paginado.body.meta.total, 1);
    assert.equal(paginado.body.meta.totalPages, 1);
  });

  await t.test('los eventos en borrador no se exponen publicamente', async () => {
    const borrador = await request(app)
      .post('/api/eventos')
      .set(auth(estado.adminToken))
      .send({
        nombre_evento: 'Evento Borrador 2026',
        fecha_evento: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString(),
        estado: 'borrador'
      })
      .expect(201);

    const categoria = await request(app)
      .post(`/api/eventos/${borrador.body.data.id_evento}/categorias`)
      .set(auth(estado.adminToken))
      .send({
        nombre_cat: '10K Borrador',
        distancia_km: 10,
        cupo_maximo: 10,
        precio: 10,
        genero: 'Mixto'
      })
      .expect(201);

    const listado = await request(app)
      .get('/api/eventos')
      .query({ estado: 'borrador' })
      .expect(200);

    assert.equal(listado.body.data.length, 0);

    await request(app)
      .get(`/api/eventos/${borrador.body.data.id_evento}`)
      .expect(404);

    await request(app)
      .get(`/api/eventos/${borrador.body.data.id_evento}/categorias`)
      .expect(404);

    await request(app)
      .get(`/api/categorias/${categoria.body.data.id_categoria}`)
      .expect(404);

    const comoAdmin = await request(app)
      .get(`/api/categorias/${categoria.body.data.id_categoria}`)
      .set(auth(estado.adminToken))
      .expect(200);

    assert.equal(comoAdmin.body.data.nombre_cat, '10K Borrador');
  });

  await t.test('errores estandarizados y 404', async () => {
    const res = await request(app)
      .get('/api/ruta-inexistente')
      .expect(404);

    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'NOT_FOUND');
    assert.equal(res.body.tema.modo_oscuro, false);

    const idInvalido = await request(app)
      .get('/api/eventos/abc')
      .expect(422);
    assert.equal(idInvalido.body.error.code, 'VALIDATION_ERROR');
  });
});
