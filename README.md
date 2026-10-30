# MarathonHub API

Backend REST para la gestion integral de carreras, maratones y eventos deportivos. Cubre eventos y categorias, inscripciones con control de cupos, entrega de kits y dorsales, cronometraje por checkpoints, resultados en vivo y certificados digitales.

- **Stack:** Node.js 20+, Express 4, Sequelize 6 (MySQL), JWT, Bcrypt, RBAC.
- **Documentacion interactiva:** Swagger UI en `http://localhost:3000/api-docs` (OpenAPI 3.0).
- **Respuestas JSON:** sobre estandar con `success`, `message`, `data` y `tema.modo_oscuro`.

---

## 1. Requisitos

- Node.js 20 o superior.
- MySQL 8 (produccion/desarrollo) o Docker.
- npm 10+.

## 2. Inicio rapido

```bash
# 1. Dependencias
npm install

# 2. Configuracion
copy .env.example .env      # Windows
# cp .env.example .env      # macOS / Linux
# Ajuste credenciales de MySQL y JWT_SECRET en .env

# 3. Base de datos MySQL (opcional, si usa Docker)
docker compose up -d

# 4. Crear/verificar esquema, roles y administrador
npm run db:sync
npm run seed

# 5. Datos de demostracion (opcional)
npm run seed:demo

# 6. Levantar la API
npm start
# o en modo desarrollo con recarga:
npm run dev
```

La API queda disponible en `http://localhost:3000`, la documentacion en `/api-docs` y el estado del servicio en `/health`.

> El arranque en desarrollo ejecuta `seedBase` automaticamente (roles + administrador) salvo que `SEED_ON_START=false`. En produccion el seeder no se ejecuta al iniciar.

## 3. Scripts

| Script | Descripcion |
| --- | --- |
| `npm start` | Inicia el servidor. |
| `npm run dev` | Servidor con `nodemon`. |
| `npm run db:sync` | Sincroniza el esquema Sequelize con MySQL. |
| `npm run seed` | Crea/verifica roles y el administrador por defecto. |
| `npm run seed:demo` | Crea eventos, corredores, dorsales, tiempos y resultados de ejemplo. |
| `npm test` | Ejecuta la suite de integracion (SQLite en memoria). |
| `npm run check` | Verificacion sintactica basica de `server.js`. |

## 4. Credenciales

Creadas por `npm run seed`:

| Rol | Email | Contrasena |
| --- | --- | --- |
| admin | `admin@marathonhub.com` | `Admin123!` |

Creadas adicionalmente por `npm run seed:demo`:

| Rol | Email | Contrasena |
| --- | --- | --- |
| staff | `staff@marathonhub.com` | `Staff123!` |
| corredor | `corredor@marathonhub.com` | `Corredor123!` |

> Cambie estas contrasenas antes de desplegar en produccion.

## 5. Arquitectura

```text
.
├── server.js                 # Bootstrap, conexion y cierre ordenado
├── src/
│   ├── app.js                # Express, seguridad, CORS, Swagger, rutas
│   ├── config/               # Variables de entorno y conexion Sequelize
│   ├── models/               # Modelos y asociaciones (tablas del PDF)
│   ├── controllers/          # Adaptadores HTTP
│   ├── services/             # Reglas de negocio y transacciones
│   ├── routes/               # Definicion de endpoints y RBAC
│   ├── middlewares/          # Auth, validacion, errores, rate limit
│   ├── validators/           # express-validator
│   ├── utils/                # Respuestas, JWT, tiempos, paginacion, errores
│   ├── docs/openapi.js       # Especificacion OpenAPI 3.0
│   ├── seeders/              # Datos base y demo
│   └── scripts/sync.js       # Sincronizacion de esquema
├── tests/api.test.js         # Pruebas de integracion end-to-end
├── docker-compose.yml        # MySQL 8 local
└── .env.example
```

Flujo de una peticion: `routes -> validators/middlewares -> controllers -> services -> models`.

## 6. Modelo de datos

| Tabla | Proposito | Campos principales |
| --- | --- | --- |
| `roles` | Roles del sistema | `id_rol`, `nombre_rol` (`admin`, `staff`, `corredor`) |
| `usuarios` | Cuentas y perfiles | `nombre`, `apellido`, `email`, `password_hash`, `telefono`, `contacto_emergencia`, `ficha_medica_json`, `modo_oscuro_pref`, `estado_cuenta`, `id_rol` |
| `eventos` | Eventos deportivos | `nombre_evento`, `descripcion`, `fecha_evento`, `ciudad`, `lugar_salida`, `estado`, `imagen_banner` |
| `categorias` | Categorias por evento | `id_evento`, `nombre_cat`, `distancia_km`, `cupo_maximo`, `precio`, `edad_minima`, `edad_maxima`, `genero` |
| `inscripciones` | Participacion de un corredor | `id_usuario`, `id_categoria`, `codigo_transaccion`, `estado_pago`, `talla_camiseta`, `fecha_inscripcion` |
| `dorsales` | Kit y numero de carrera | `id_inscripcion`, `numero_dorsal`, `chip_code`, `estado_kit` |
| `tiempos_checkpoints` | Marcas de cronometraje | `id_dorsal`, `nombre_punto`, `tiempo_marcado`, `id_staff_registro` |

### Extensiones sobre el modelo base

- `usuarios.fecha_nacimiento` y `usuarios.genero`: necesarios para validar categorias por edad y genero (RF-02).
- `dorsales.numero_dorsal` es unico globalmente para permitir consultas publicas por dorsal y certificados fiables.
- Restriccion unica `(id_usuario, id_categoria)` en `inscripciones`: evita duplicados activos. Una inscripcion cancelada se reutiliza al volver a inscribirse.
- `tiempos_checkpoints` tiene indice unico `(id_dorsal, nombre_punto)`: no se repite un checkpoint en el mismo dorsal.

## 7. Roles y permisos (RBAC)

| Recurso / accion | admin | staff | corredor | publico |
| --- | :---: | :---: | :---: | :---: |
| Registro/login/perfil | - | - | - | si |
| Gestion de usuarios y roles | si | no | no | no |
| CRUD de eventos y categorias | si | no | no | lectura |
| Estadisticas del evento | si | no | no | no |
| Inscribirse / ver sus inscripciones | si | no | si | no |
| Confirmar pago | si | no | no | no |
| Entregar kit / asignar dorsal | si | si | no | no |
| Registrar checkpoints | si | si | no | no |
| Corregir/eliminar marcaciones | si | no | no | no |
| Resultados y certificados | - | - | - | si |

## 8. Endpoints principales

La referencia completa, con esquemas, ejemplos y codigos de respuesta, esta en Swagger UI (`/api-docs`). Resumen:

### Autenticacion

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| POST | `/api/auth/register` | Registro publico de corredor. |
| POST | `/api/auth/login` | Inicio de sesion (JWT, 24 h). |
| GET | `/api/auth/me` | Perfil autenticado. |
| PUT | `/api/auth/me` | Actualizar perfil. |
| PUT | `/api/auth/password` | Cambiar contrasena. |
| PUT | `/api/auth/preferencias` | Guardar `modo_oscuro_pref`. |
| POST | `/api/auth/logout` | Cierre de sesion stateless. |

### Usuarios y roles

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET/POST | `/api/usuarios` | Listar / crear usuarios (admin). |
| GET/PUT/DELETE | `/api/usuarios/{id}` | Consultar / actualizar / desactivar (admin). |
| PATCH | `/api/usuarios/{id}/estado` | Activar o desactivar cuenta. |
| PUT | `/api/usuarios/{id}/password` | Restablecer contrasena. |
| GET | `/api/roles` | Listar roles (admin). |

### Eventos y categorias

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/eventos` | Listado publico con filtros y paginacion. |
| GET | `/api/eventos/{id}` | Detalle con categorias y cupos. |
| POST/PUT/DELETE | `/api/eventos` / `/api/eventos/{id}` | Gestion (admin). |
| PATCH | `/api/eventos/{id}/estado` | Cambiar estado (`borrador`, `publicado`, `en_curso`, `finalizado`). |
| GET | `/api/eventos/{id}/estadisticas` | Recaudado, cupos, kits y marcaciones (admin). |
| GET/POST | `/api/eventos/{idEvento}/categorias` | Listar / crear categorias. |
| GET/PUT/DELETE | `/api/categorias/{id}` | Detalle / edicion / eliminacion. |

### Inscripciones

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET/POST | `/api/inscripciones` | Listar (propias o todas si admin) / inscribirse. |
| GET | `/api/inscripciones/{id}` | Detalle con dorsal y tiempos. |
| PATCH | `/api/inscripciones/{id}/pago` | Confirmar/cancelar pago (admin). |
| POST | `/api/inscripciones/{id}/pago-simulado` | Simular pago aprobado de la inscripcion propia (checkout demo). |
| DELETE | `/api/inscripciones/{id}` | Cancelar inscripcion (corredor dueno o admin). |

### Kits y cronometraje

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/kits` | Listar kits con filtros por evento/categoria/estado. |
| GET | `/api/kits/{idInscripcion}` | Estado del kit. |
| PUT | `/api/kits/entregar` | Entregar kit y asignar dorsal/chip (staff/admin). |
| POST | `/api/cronometraje/marcar` | Registrar checkpoint por `numero_dorsal` o `id_dorsal`. |
| GET | `/api/cronometraje/evento/{idEvento}` | Feed de marcaciones en vivo. |
| GET | `/api/cronometraje/dorsal/{idDorsal}` | Marcaciones y calculo de un dorsal. |
| PUT/DELETE | `/api/cronometraje/{idTiempo}` | Correccion/eliminacion (admin). |

### Resultados y certificados

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| GET | `/api/resultados/evento/{idEvento}` | Resultados por categoria y resumen. |
| GET | `/api/resultados/categoria/{idCategoria}` | Resultados de una categoria. |
| GET | `/api/resultados/dorsal/{numeroDorsal}` | Resultado individual y splits. |
| GET | `/api/resultados/certificado/{numeroDorsal}` | Datos del certificado digital. |

## 9. Reglas de negocio relevantes

- **Inscripciones:** solo en eventos `publicado`; se valida cupo (sin contar canceladas), genero y rango de edad; una sola inscripcion activa por usuario/categoria.
- **Concurrencia:** creacion de inscripciones y entrega de kits usan transacciones con bloqueo pesimista (`SELECT ... FOR UPDATE` en MySQL) para evitar sobreventa y dorsales duplicados.
- **Dorsales:** se asignan automaticamente desde `1001` al crear la inscripcion (estado pendiente) y se confirman al entregar el kit; tambien puede asignarse un numero o chip manual, verificando que no esten ocupados.
- **Pago simulado:** el flujo de checkout del frontend puede aprobar el pago con `POST /api/inscripciones/{id}/pago-simulado`; el staff solo puede entregar kits con `estado_pago: completado`.
- **Tiempos:** el tiempo neto se calcula entre `SALIDA` y `META`. Los puntos se normalizan (mayusculas, sin acentos, espacios colapsados) y no se permiten duplicados por dorsal/punto.
- **Certificado:** requiere `SALIDA` + `META` y pago completado. Incluye posicion por categoria, posicion por genero y codigo de verificacion SHA-256.
- **Tema:** cada respuesta incluye `tema.modo_oscuro`. Se resuelve del JWT del usuario; en rutas publicas o sin token es `false`.

## 10. Formato de respuesta

Exito:

```json
{
  "success": true,
  "message": "Eventos obtenidos correctamente.",
  "data": [],
  "tema": { "modo_oscuro": true },
  "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0, "hasNext": false, "hasPrev": false }
}
```

Error:

```json
{
  "success": false,
  "message": "Los datos enviados no son validos.",
  "data": null,
  "tema": { "modo_oscuro": false },
  "error": { "code": "VALIDATION_ERROR", "details": [] }
}
```

Codigos HTTP usados: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `413`, `422`, `500`, `503`.

## 11. Ejemplos rapidos

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@marathonhub.com","password":"Admin123!"}'

# Listar eventos publicados
curl "http://localhost:3000/api/eventos?estado=publicado&page=1&limit=10"

# Inscribirse (token de corredor)
curl -X POST http://localhost:3000/api/inscripciones \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id_categoria":1,"talla_camiseta":"M"}'

# Entregar kit (token de staff/admin)
curl -X PUT http://localhost:3000/api/kits/entregar \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id_inscripcion":1}'
```

## 12. Pruebas

```bash
npm test
```

La suite usa `node:test` + `supertest` y una base **SQLite en memoria**, por lo que no requiere MySQL ni Docker. Cubre el flujo integral: autenticacion, tema, RBAC, eventos/categorias, cupos, inscripciones, pagos, kits, dorsales, checkpoints, tiempo neto, resultados, certificado, estadisticas y errores estandarizados.

> SQLite se usa exclusivamente para pruebas. El dialecto de produccion es MySQL (`DB_DIALECT=mysql`); alli se aplican los tipos `ENUM`, `DECIMAL`, indices y bloqueos `FOR UPDATE`.

## 13. Variables de entorno

| Variable | Default | Descripcion |
| --- | --- | --- |
| `NODE_ENV` | `development` | Entorno de ejecucion. |
| `PORT` | `3000` | Puerto HTTP. |
| `DB_DIALECT` | `mysql` | `mysql` o `sqlite` (pruebas). |
| `DB_HOST` / `DB_PORT` | `localhost` / `3306` | Conexion MySQL. |
| `DB_USER` / `DB_PASSWORD` | `root` / `1234` | Credenciales MySQL. |
| `DB_NAME` | `db_maraton_hub` | Nombre de la base. |
| `DB_SYNC` | `true` | Sincroniza el esquema al iniciar. |
| `JWT_SECRET` | - | Secreto de firma JWT (obligatorio en produccion). |
| `JWT_EXPIRES_IN` | `24h` | Vigencia del token. |
| `BCRYPT_SALT_ROUNDS` | `10` | Minimo 10 rondas. |
| `CORS_ORIGIN` | `*` | Origenes permitidos (separados por coma). |
| `RATE_LIMIT_*` | - | Limites globales y de autenticacion. |
| `SEED_ON_START` | `true` | Ejecutar seeder base al iniciar (no en produccion). |
| `ADMIN_*` | - | Datos del administrador inicial. |

## 14. Notas de produccion

- Reemplace `JWT_SECRET` y las contrasenas de ejemplo.
- Desactive `DB_SYNC` y gestione el esquema con migraciones o `npm run db:sync` controlado.
- Use HTTPS y restrinja `CORS_ORIGIN` a los dominios del frontend.
- El rate limit por defecto permite picos de hasta ~500 req/s por IP (30 000/min) para no bloquear la meta de 300 req/s concurrentes. Ajustelo segun trafico real y politicas de abuso.
- Los logs de errores 5xx se imprimen en consola; integre un colector de logs en produccion.

---

## 15. Frontend (React + Vite)

Aplicacion web en `frontend/` conectada a esta API. Incluye experiencias publica, corredor, staff y administrador, con tema oscuro por defecto y diseno responsive.

### Stack

React 18 · TypeScript · Vite · Tailwind CSS 3 · Radix UI · TanStack Query 5 · Zustand · React Hook Form + Zod · React Router 6 · Recharts · Framer Motion · Sonner · `qrcode.react` · `html5-qrcode` · jsPDF · xlsx.

### Inicio

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxy /api -> http://localhost:3000)
```

La API debe estar corriendo en `http://localhost:3000`. El proxy de Vite evita problemas de CORS en desarrollo.

Para apuntar a otra API cree `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

Si no se define, el cliente usa `/api` y el proxy de desarrollo.

### Scripts

| Script | Descripcion |
| --- | --- |
| `npm run dev` | Servidor de desarrollo con HMR. |
| `npm run build` | Typecheck (`tsc --noEmit`) + build de produccion en `dist/`. |
| `npm run preview` | Sirve el build de produccion. |
| `npm run lint` | Verificacion TypeScript. |

### Rutas principales

| Rol | Rutas |
| --- | --- |
| Publico | `/`, `/eventos`, `/eventos/:id`, `/resultados`, `/login`, `/registro` |
| Corredor | `/app`, `/app/inscribirse`, `/app/pase`, `/app/resultados`, `/app/perfil` |
| Staff | `/staff` (kits), `/staff/evento` (cronometraje e incidencias), `/staff/perfil` |
| Admin | `/admin`, `/admin/carreras`, `/admin/kits`, `/admin/usuarios`, `/admin/reportes`, `/admin/perfil` |

### Funcionalidad destacada

- **Landing y catalogo:** proximo evento con cuenta regresiva, catalogo con filtros, detalle con distancias, cupos, precios y reglamento.
- **Inscripcion en 4 pasos:** categoria, ficha de salud/emergencia/talla, pago simulado y confirmacion con dorsal y comprobante PDF.
- **Pase digital:** QR dinamico que rota cada 30 segundos; el staff lo resuelve por `id_inscripcion`, dorsal o chip.
- **Staff:** escaneo con camara o busqueda manual, verificacion de pago y entrega de kit en tiempo real; registro de marcas y feed en vivo.
- **Admin:** KPIs consolidados con graficos, CRUD de carreras y categorias, inventario de kits por talla, usuarios/roles y exportaciones CSV/Excel.
- **Tema:** oscuro por defecto (slate-950 + verde neon/naranja), deteccion del sistema y toggle manual persistido en `localStorage`; respeta `tema.modo_oscuro` devuelto por la API.
- **Incidencias:** se almacenan localmente en el dispositivo del staff (no hay tabla backend); son para coordinacion operativa inmediata.

### Credenciales demo

Requieren `npm run seed:demo` en el backend:

| Rol | Email | Contrasena |
| --- | --- | --- |
| Admin | `admin@marathonhub.com` | `Admin123!` |
| Staff | `staff@marathonhub.com` | `Staff123!` |
| Corredor | `corredor@marathonhub.com` | `Corredor123!` |

### Produccion

```bash
cd frontend
npm run build
# Servir frontend/dist con Nginx, Vercel, Netlify o el servidor estatico de su preferencia.
```

Configure el rewrite de SPA hacia `index.html` y apunte `/api` (o `VITE_API_URL`) al backend desplegado.

