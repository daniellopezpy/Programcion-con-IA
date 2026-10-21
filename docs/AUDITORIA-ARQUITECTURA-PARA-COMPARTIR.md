# Auditoría y arquitectura de Saldo Finanzas

Documento preparado para compartir con el equipo y con Antigravity.

## 1. Resumen del sistema

Saldo es una aplicación de finanzas personales con autenticación, registro de ingresos y egresos, categorías, filtros por período y dashboard financiero.

```text
Navegador
  └── React + Vite + Tailwind
        └── REST JSON /api
              └── Laravel + Sanctum
                    └── MySQL
```

El backend es la fuente de verdad para autenticación, autorización, validaciones, cálculos financieros y aislamiento de datos. El frontend se encarga de la experiencia, navegación, estados de pantalla y consumo de la API.

## 2. Tecnologías actuales

### Frontend

- React 19 con JavaScript y JSX.
- Vite 8 como servidor de desarrollo y empaquetador.
- Tailwind CSS 4 mediante el plugin de Vite.
- React Router 7 para rutas públicas y protegidas.
- Recharts para las gráficas del dashboard.
- Lucide React para iconos.
- `class-variance-authority`, `clsx` y `tailwind-merge` para componentes y clases.
- Oxlint para validación estática.
- Cliente HTTP propio basado en `fetch`.

Archivos principales:

- `finanzas-web/src/lib/api.js`
- `finanzas-web/src/context/AuthContext.jsx`
- `finanzas-web/src/layouts/AppLayout.jsx`
- `finanzas-web/src/pages/HomePage.jsx`
- `finanzas-web/src/pages/EntriesPage.jsx`
- `finanzas-web/src/pages/ExpensesPage.jsx`
- `finanzas-web/src/pages/ExpenseFormPage.jsx`

### Backend

- PHP 8.3 o superior.
- Laravel 13.
- Laravel Sanctum 4 para tokens Bearer.
- Eloquent ORM.
- MySQL 8.4 en el entorno local.
- Form Requests para validación.
- PHPUnit para pruebas de integración y aislamiento.
- Composer, Artisan y Laravel Pint.
- Laravel Boost, Pail y Tinker como herramientas de desarrollo.

Archivos principales:

- `finanzas-api/routes/api.php`
- `finanzas-api/app/Http/Controllers/AuthController.php`
- `finanzas-api/app/Http/Controllers/DashboardController.php`
- `finanzas-api/app/Http/Controllers/IngresoController.php`
- `finanzas-api/app/Http/Controllers/EgresoController.php`
- `finanzas-api/app/Http/Controllers/CategoriaController.php`
- `finanzas-api/config/database.php`
- `finanzas-api/database/migrations/`

## 3. APIs actuales

No se consume actualmente una API externa de bancos, pagos, correo, analítica o servicios financieros. La aplicación consume su propia API Laravel.

### Rutas públicas

```text
POST /api/register
POST /api/login
```

### Rutas protegidas por Sanctum

```text
GET  /api/user
POST /api/logout

GET /api/dashboard/resumen?anio=YYYY&mes=M
GET /api/dashboard/egresos-por-categoria?anio=YYYY&mes=M
GET /api/dashboard/resumen-anual?anio=YYYY

CRUD /api/ingresos
CRUD /api/egresos
CRUD /api/categorias
```

El frontend consume `/api` y Vite lo redirige en desarrollo hacia Laravel en `127.0.0.1:8000`. `VITE_API_URL` permite cambiar el origen en otros entornos.

### Dependencias externas de ejecución

- MySQL es una dependencia de infraestructura, no una API externa.
- Google Fonts se carga desde `fonts.googleapis.com` en el frontend.
- Recharts y Lucide se empaquetan en el build; no son llamadas HTTP de negocio.
- Bruno es una herramienta de prueba, no un proveedor externo.

## 4. Seguridad actual

Puntos sólidos:

- Rutas de negocio protegidas con `auth:sanctum`.
- Consultas de ingresos y egresos filtradas por el usuario autenticado.
- Validación en Form Requests.
- Relaciones de categorías y movimientos con claves foráneas.
- Pruebas de aislamiento entre usuarios.
- Secretos locales excluidos del repositorio.

Puntos que requieren revisión antes de producción:

- El token se almacena en `localStorage`; evaluar cookies `HttpOnly`, `Secure` y `SameSite`.
- Agregar expiración y rotación de tokens.
- Aplicar rate limiting a registro y login.
- Agregar auditoría de accesos y operaciones sensibles.
- Definir una política de CORS y headers de seguridad.
- Mover Google Fonts a assets propios si se requiere privacidad o funcionamiento sin CDN.

## 5. Riesgos de escalabilidad

### Alta prioridad

1. Los listados usan `get()` y devuelven todo el historial. Se necesita paginación o cursor pagination.
2. Los scopes usan `whereYear()` y `whereMonth()`. Para aprovechar índices deben cambiarse a rangos de fecha.
3. El login no tiene rate limiting explícito.
4. El token en `localStorage` aumenta la exposición ante XSS.
5. No existe versionado de API; se recomienda `/api/v1`.

### Prioridad media

1. Cachear resúmenes por usuario, año y mes.
2. Mover cache, sesiones y colas a Redis en producción.
3. Agregar índices después de medir consultas reales con `EXPLAIN`.
4. Normalizar respuestas con Laravel API Resources.
5. Agregar timeout, cancelación y reintentos controlados al cliente HTTP.
6. Dividir el bundle frontend por rutas y cargar Recharts bajo demanda.

### Evolución futura

1. Crear agregados mensuales para dashboards de alto volumen.
2. Incorporar workers para cálculos y tareas pesadas.
3. Preparar réplicas de lectura para reportes.
4. Centralizar logs, métricas, trazas y alertas.
5. Automatizar backups y migraciones de despliegue.
6. Servir el frontend mediante CDN y mantener el backend stateless.

## 6. Arquitectura objetivo

```text
                ┌─────────────────────┐
                │ React SPA            │
                │ Rutas + UI + Query   │
                └──────────┬──────────┘
                           │ HTTPS /api/v1
                ┌──────────▼──────────┐
                │ Laravel API         │
                │ Auth + Resources    │
                │ Validación + Rate   │
                └──────┬────────┬──────┘
                       │        │
              ┌────────▼───┐ ┌──▼────────┐
              │ MySQL      │ │ Redis     │
              │ Datos      │ │ Cache/jobs│
              └────────────┘ └───────────┘
```

Reglas de diseño:

- El frontend nunca calcula totales financieros como fuente de verdad.
- El backend siempre filtra por `user_id`.
- Los endpoints deben responder JSON consistente.
- Las listas deben aceptar filtros y paginación.
- Los dashboards deben poder cachearse sin mezclar usuarios.
- Los cambios de contrato requieren versión o compatibilidad temporal.

## 7. Plan para Antigravity

Antigravity debe leer primero `AGENTS.md` y `docs/ARQUITECTURA-ANTIGRAVITY.md`. Codex actúa como arquitecto y revisor; Antigravity implementa.

### Fase 1 — Rendimiento de API

- Agregar paginación a ingresos y egresos.
- Añadir filtros por rango de fechas.
- Reemplazar `whereYear()` y `whereMonth()` por rangos indexables.
- Mantener aislamiento por usuario.
- Crear pruebas de paginación, filtros y aislamiento.

### Fase 2 — Seguridad

- Rate limiting de login y registro.
- Política de expiración y revocación de tokens.
- Revisión de almacenamiento de sesión.
- Headers de seguridad y CORS documentados.

### Fase 3 — Dashboard y cache

- Medir consultas con `EXPLAIN`.
- Cachear resúmenes por usuario y período.
- Preparar Redis y jobs sin cambiar todavía el contrato público.

### Fase 4 — Frontend

- Implementar cliente de consultas con cancelación.
- Añadir estados paginados y filtros.
- Separar rutas y gráficas mediante carga diferida.
- Mantener el sistema visual ThoughtStream.

### Fase 5 — Operación

- Health checks y readiness.
- Logs estructurados y métricas.
- Backups y estrategia de migraciones.
- Preparación para despliegue horizontal.

## 8. Criterios de aceptación

Una tarea queda lista cuando:

- conserva los contratos existentes o documenta una versión compatible;
- mantiene el aislamiento entre usuarios;
- pasa las pruebas correspondientes;
- no expone secretos;
- funciona en estados de carga, vacío, error y éxito;
- no introduce desbordamientos visuales;
- deja un diff pequeño y revisable.

Comprobaciones mínimas:

```text
cd finanzas-api
php artisan test

cd ../finanzas-web
pnpm lint
pnpm build

git diff --check
```

## 9. Directiva inicial para Antigravity

```text
Lee AGENTS.md, docs/ARQUITECTURA-ANTIGRAVITY.md y docs/AUDITORIA-ARQUITECTURA-PARA-COMPARTIR.md.

Actúa como implementador. No modifiques main directamente. Crea una rama codex/antigravity/<tarea>.

Comienza con la Fase 1: paginación, filtros por rango de fecha y consultas indexables para ingresos y egresos. Antes de editar, presenta un plan con objetivo, archivos, riesgos y pruebas. Después implementa, ejecuta las comprobaciones y entrega un resumen de cambios y resultados.
```
