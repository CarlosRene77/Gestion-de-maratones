Actúa como un desarrollador frontend Senior especializado en React, Tailwind CSS y diseño UX/UI moderno. Tu objetivo es construir el cliente web completo, profesional, interactivo y responsivo para una Plataforma de Gestión de Carreras y Maratones, perfectamente integrado con una API RESTful en Node.js/Express y MySQL.

---

### 1. STACK TECNOLÓGICO Y ESTÁNDARES
- **Framework/Build Tool:** React 18+ (con Vite) o Next.js (App Router).
- **Estilos y UI:** Tailwind CSS v3+, Shadcn UI / Radix UI, Lucide React (iconografía deportiva moderna).
- **Manejo de Estado y Peticiones:** TanStack Query (React Query v5) para caché y sincronización con el servidor; Zustand o React Context para el estado global de autenticación y preferencia de tema.
- **Formularios y Validación:** React Hook Form + Zod.
- **Enrutamiento:** React Router v6 (con guardias de rutas protegidas por rol).
- **Gráficos y Animaciones:** Recharts / Chart.js para dashboards analíticos; Framer Motion para micro-interacciones suaves.
- **Lector de QR:** `html5-qrcode` o `@zxing/library` para la validación de kits en el evento.
- **Tema:** Modo Oscuro / Claro dinámico con detección automática del sistema y alternador manual (persistente en `localStorage` usando clases `dark:` de Tailwind).

---

### 2. ARQUITECTURA DE AUTENTICACIÓN Y ROLES (RBAC)
Implementa un sistema de rutas jerárquico guiado por tokens JWT y permisos por rol:

1. **Público (Sin sesión requerida):**
   - **Landing Page Deportiva:** Hero section con la próxima gran carrera, contador regresivo (countdown timer) y catálogo interactivo de eventos disponibles.
   - **Vista Detallada del Evento:** Información completa de la carrera (distancias 5K, 10K, 21K, 42K, reglamento, ruta con mapa integrado, patrocinadores, costos y cupos restantes).
   - **Tabla Pública de Resultados / Leaderboard:** Buscador de tiempos oficiales por número de dorsal, nombre o categoría.
   - **Autenticación:** Páginas de Inicio de Sesión (Login) y Registro de Corredores con validaciones en tiempo real.

2. **Rol Corredor / Participante (`corredor`):**
   - **Dashboard Personal:** Lista de carreras inscritas (próximas y pasadas) con barra de progreso de preparación.
   - **Pase Digital / Carnet de Corredor:** Tarjeta virtual con Código QR único dinámico para la recolección del kit y acceso el día de la competencia.
   - **Wizard de Inscripción (Multipaso):**
     1. Selección de distancia y categoría (Varonil, Femenil, Libre, Máster).
     2. Formulario de datos de salud, alergias, contacto de emergencia y talla de playera (S, M, L, XL).
     3. Pasarela/Módulo de Pago (Simulación de tarjeta de crédito/débito o subida de comprobante).
     4. Confirmación e impresión/descarga del comprobante oficial con número de dorsal asignado.
   - **Mis Tiempos y Certificados:** Historial de tiempos de meta y descarga de certificado digital de participación en formato PDF.

3. **Rol Staff / Operativo (`staff`):**
   - **Módulo Acreditación y Entrega de Kits (Día del Evento):**
     - Escáner de Código QR mediante la cámara de la lap/móvil o búsqueda manual rápida por DNI/correo.
     - Modal de verificación rápida con datos del corredor y talla de playera asignada.
     - Botón de confirmación "Entregar Kit" que actualiza el estado en la base de datos en tiempo real.
   - **Registro de Incidencias:** Módulo para reporte rápido de cambios de talla, dorsales extraviados o soporte en línea de meta.

4. **Rol Administrador (`admin`):**
   - **Dashboard Ejecutivo:** Tarjetas de métricas KPI (total recaudado, total corredores inscritos, % de kits entregados, desglose por género/categoría) y gráficos de tendencias.
   - **Gestión de Carreras (CRUD Completo):** Crear/editar carreras, definir cupos, fechas de apertura/cierre de inscripciones, ajustar costos por etapas y cargar imágenes promocionales.
   - **Gestión de Categorías y Kits:** Control de inventario de playeras por talla y asignación de rangos de edad.
   - **Gestión de Usuarios y Personal:** Asignar roles (Promover usuario a Staff), activar/suspender cuentas.
   - **Exportación de Datos:** Botones para descargar listas oficiales de salida en formatos CSV/Excel con filtros avanzados.

---

### 3. DISEÑO UX/UI Y SISTEMA DE COMPONENTES
- **Estética Deportiva y Moderna:** Paleta de colores de alto contraste.
  - *Modo Oscuro (Predeterminado):* Fondo Slate-950 (`#020617`), tarjetas Slate-900 (`#0f172a`), acentos en Verde Neón (`#22c55e`) o Naranja Eléctrico (`#f97316`) y textos Slate-50.
  - *Modo Claro:* Fondo Zinc-50, tarjetas blancas con sombras suaves y acentos oscuros contrastantes.
- **Layout Responsivo (Mobile-First):**
  - Navegación inferior (Bottom Navigation Bar) en dispositivos móviles para corredores y staff.
  - Sidebar replegable con colapsado suave para pantallas de escritorio en paneles administrativos.
- **Feedback Visual:**
  - Skeleton Loaders para todas las peticiones asíncronas.
  - Notificaciones Toast (Sonner o React Hot Toast) para respuestas de la API (éxito, advertencia, error).
  - Badges coloridos de estado (`Verificado`: Verde, `Pendiente`: Amarillo, `Cancelado`: Rojo, `Kit Entregado`: Azul).

---

### 4. ESTRUCTURA DE PROYECTO RECOMENDADA
```text
src/
├── assets/          # Imágenes, logos, íconos SVG
├── components/      # Componentes UI reutilizables (Button, Input, Modal, Table, Badge, ThemeToggle)
├── context/         # AuthContext, ThemeContext
├── hooks/           # useAuth, useRaces, useQRScanner, useTheme
├── layouts/         # PublicLayout, DashboardLayout, AdminLayout, StaffLayout
├── pages/
│   ├── public/      # Home, RaceDetail, Leaderboard, Login, Register
│   ├── runner/      # RunnerDashboard, RaceRegistration, MyPass, MyResults
│   ├── staff/       # KitCheckin, EventControl
│   └── admin/       # AdminDashboard, ManageRaces, ManageUsers, Reports
├── services/        # Cliente Axios, auth.service.js, races.service.js, registrations.service.js
├── store/           # Estado global con Zustand (si aplica)
├── types/           # Definiciones TypeScript / Esquemas de validación Zod
└── utils/           # Formateadores (fechas, formato de moneda, tiempos mm:ss:ms)


---

# Prompt Maestro para Generación del Backend (Parte 2)

Esta documentación detalla la estructura de base de datos, la matriz de control de acceso (RBAC) y los requerimientos de arquitectura para el desarrollo del backend.

---

## 📋 Tablas, Atributos y Asociaciones (Modelos Sequelize)

1. **roles** (Modelo: `Roles`)
   * `id_rol`: PK, AI
   * `nombre_rol`: ENUM (`'admin'`, `'staff'`, `'corredor'`)

2. **usuarios** (Modelo: `Usuarios`)
   * `id_usuario`: PK, AI
   * `id_rol`: FK $\rightarrow$ `roles.id_rol`
   * `nombre`: VARCHAR
   * `apellido`: VARCHAR
   * `email`: VARCHAR (UNIQUE)
   * `password_hash`: VARCHAR
   * `telefono`: VARCHAR
   * `contacto_emergencia`: VARCHAR
   * `ficha_medica_json`: JSON
   * `modo_oscuro_pref`: BOOLEAN (DEFAULT `false`)
   * `estado_cuenta`: ENUM (`'activo'`, `'inactivo'`)

3. **eventos** (Modelo: `Eventos`)
   * `id_evento`: PK, AI
   * `nombre_evento`: VARCHAR
   * `descripcion`: TEXT
   * `fecha_evento`: DATETIME
   * `ciudad`: VARCHAR
   * `lugar_salida`: VARCHAR
   * `estado`: ENUM (`'borrador'`, `'publicado'`, `'en_curso'`, `'finalizado'`)
   * `imagen_banner`: VARCHAR

4. **categorias** (Modelo: `Categorias`)
   * `id_categoria`: PK, AI
   * `id_evento`: FK $\rightarrow$ `eventos.id_evento`
   * `nombre_cat`: VARCHAR (Ej: 10K Libre, 21K Master)
   * `distancia_km`: DECIMAL
   * `cupo_maximo`: INT
   * `precio`: DECIMAL
   * `edad_minima`: INT
   * `edad_maxima`: INT
   * `genero`: ENUM (`'M'`, `'F'`, `'Mixto'`)

5. **inscripciones** (Modelo: `Inscripciones`)
   * `id_inscripcion`: PK, AI
   * `id_usuario`: FK $\rightarrow$ `usuarios.id_usuario`
   * `id_categoria`: FK $\rightarrow$ `categorias.id_categoria`
   * `codigo_transaccion`: VARCHAR
   * `estado_pago`: ENUM (`'pendiente'`, `'completado'`, `'cancelado'`)
   * `talla_camiseta`: VARCHAR
   * `fecha_inscripcion`: TIMESTAMP/DATETIME

6. **dorsales** (Modelo: `Dorsales`)
   * `id_dorsal`: PK, AI
   * `id_inscripcion`: FK $\rightarrow$ `inscripciones.id_inscripcion`
   * `numero_dorsal`: INT
   * `chip_code`: VARCHAR
   * `estado_kit`: ENUM (`'pendiente'`, `'entregado'`)

7. **tiempos_checkpoints** (Modelo: `TiemposCheckpoints`)
   * `id_tiempo`: PK, AI
   * `id_dorsal`: FK $\rightarrow$ `dorsales.id_dorsal`
   * `nombre_punto`: VARCHAR (Ej: KM 5, Meta)
   * `tiempo_marcado`: TIME/TIMESTAMP
   * `id_staff_registro`: FK $\rightarrow$ `usuarios.id_usuario`

---

## 🔐 Matriz de Control de Acceso por Roles (RBAC)

| Módulo / Endpoint | Método | Rol Permitido | Descripción del Acceso |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Público | Autenticación universal con JWT que retorna el rol y tema. |
| `/api/eventos` | `POST / PUT / DELETE` | Admin / Organizador | Creación y modificación de carreras, categorías y cupos. |
| `/api/inscripciones` | `POST / GET` | Corredor / Admin | Registro a carreras y consulta de historial individual. |
| `/api/kits/entregar` | `PUT` | Staff / Admin | Validación y entrega física del kit de carrera y número dorsal. |
| `/api/cronometraje/marcar` | `POST` | Staff / Cronometrador | Registro en tiempo real del paso de corredores por checkpoints. |

---

## ⚙️ Requerimientos de Código y Estructura

* **Arquitectura en capas:** Organizar el proyecto utilizando las carpetas `/config`, `/models`, `/controllers`, `/routes` y `/middlewares`.
* **Seeders:** Incluir scripts de Seeders para poblar automáticamente los roles iniciales y un usuario Administrador por defecto.
* **Estandarización JSON:** Toda la API debe retornar objetos JSON estandarizados que incluyan la preferencia del tema visual del usuario (modo oscuro) para consumo en un frontend adaptativo.