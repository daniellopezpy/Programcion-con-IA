# Arquitectura y directrices de implementación

Este documento es el contrato de trabajo para Antigravity. Codex actúa como arquitecto y revisor; Antigravity ejecuta las tareas aprobadas y devuelve evidencia verificable.

## Objetivo del producto

Saldo es una aplicación de finanzas personales. Una persona puede crear una cuenta, iniciar sesión, registrar ingresos y egresos, consultar movimientos por mes y año, y ver un dashboard con balance, acumulados y gráficas.

La prioridad es entregar un sistema confiable, comprensible y mantenible. La experiencia visual debe conservar el lenguaje ThoughtStream: fondo cálido, superficies planas, tipografía serif para títulos, Inter para interfaz, contraste accesible, bordes sutiles y ausencia de decoración que no aporte información.

## Estructura de alto nivel

```text
saldo-finanzas/
├── finanzas-api/       Laravel 13, PHP, Sanctum, MySQL
├── finanzas-web/       React, Vite, Tailwind CSS v4, JavaScript/JSX
├── .tools/             Herramientas locales; nunca publicar
├── AGENTS.md           Reglas compartidas entre agentes
└── docs/               Arquitectura, decisiones y guías del proyecto
```

El backend es la fuente de verdad para autenticación, autorización, validación, cálculos financieros y aislamiento por usuario. El frontend presenta el estado, mantiene la navegación y consume exclusivamente la API.

## Límites y responsabilidades

### Backend Laravel

- `AuthController`: registro, login, usuario actual y logout mediante Sanctum.
- `IngresoController`: CRUD de ingresos, filtrado por `anio` y `mes`.
- `EgresoController`: CRUD de egresos, filtrado por período y relación con categoría/subcategoría.
- `CategoriaController`: catálogo de categorías y subcategorías disponibles para la cuenta.
- `DashboardController`: resumen mensual, egresos por categoría y resumen anual de doce meses.
- Form Requests: toda validación de entrada debe ejecutarse en el backend.
- Modelos y consultas: toda consulta de movimientos debe limitarse al usuario autenticado.

### Frontend React

- `AuthContext` y `ProtectedRoute`: sesión, restauración y redirección.
- `AppLayout`: navegación, identidad visual y estructura responsive.
- `HomePage`: dashboard y selección compartida de período.
- `EntriesPage`: listado vacío, cargando, error y datos de ingresos.
- `ExpensesPage`: listado, eliminación y navegación al formulario.
- `ExpenseFormPage`: creación y edición con categorías y errores del backend.
- `lib/api.js`: única puerta de entrada HTTP; debe conservar Bearer token, manejo de 401 y errores estructurados.

## Contrato actual de API

Rutas públicas:

- `POST /api/register`
- `POST /api/login`

Rutas protegidas con `auth:sanctum`:

- `GET /api/user`
- `POST /api/logout`
- `GET /api/dashboard/resumen?anio=YYYY&mes=M`
- `GET /api/dashboard/egresos-por-categoria?anio=YYYY&mes=M`
- `GET /api/dashboard/resumen-anual?anio=YYYY`
- CRUD `/api/ingresos`
- CRUD `/api/egresos`
- CRUD `/api/categorias`

No cambiar nombres, métodos, filtros ni forma de los payloads sin una decisión arquitectónica explícita. Los importes se conservan como decimales, las fechas determinan el período y las respuestas de error deben seguir siendo interpretables por el frontend.

## Flujo de desarrollo con Antigravity

1. Codex redacta o aprueba una tarea concreta con alcance, archivos probables y criterios de aceptación.
2. Antigravity lee `AGENTS.md` y este documento antes de editar.
3. Antigravity crea una rama `codex/antigravity/<tarea>` desde `main` actualizado.
4. Antigravity implementa una sola tarea por rama y evita cambios no relacionados.
5. Antigravity ejecuta las pruebas adecuadas y entrega un resumen con archivos, comandos y resultados.
6. Codex revisa el diff, la seguridad, los contratos y el comportamiento visual.
7. Solo después de la revisión se integra la rama a `main` y se publica.

Nunca trabajar simultáneamente sobre los mismos archivos en dos ramas sin coordinación. No usar credenciales, tokens o archivos `.env` como parte de una tarea o de un commit.

## Fases de implementación

### Fase 0 — Preparación

- Leer `AGENTS.md`, este documento y la documentación específica del módulo.
- Confirmar rama, estado limpio y comandos disponibles.
- No tocar datos locales ni credenciales.

### Fase 1 — Backend

- Implementar cambios de dominio mediante migración, modelo, Form Request, controlador y prueba.
- Verificar autorización y aislamiento con usuarios distintos.
- Mantener consultas acotadas y respuestas JSON consistentes.

### Fase 2 — Frontend

- Conectar la pantalla al endpoint existente mediante `lib/api.js`.
- Cubrir estados de carga, vacío, error, éxito y sesión expirada.
- Mantener responsive, accesibilidad básica, foco visible y el sistema ThoughtStream.

### Fase 3 — Integración

- Probar el flujo completo desde navegador: registro/login, dashboard, filtros, alta, edición y eliminación.
- Confirmar que una cuenta no puede ver movimientos de otra.
- Revisar que no existan desbordamientos, zonas sin estilo o texto ilegible.

### Fase 4 — Entrega

- Ejecutar las comprobaciones.
- Revisar `git diff --check`.
- Presentar el diff para aprobación.
- Integrar a `main` solo con autorización de Codex y del responsable del proyecto.

## Comprobaciones obligatorias

Backend:

```text
cd finanzas-api
php artisan test
```

Frontend:

```text
cd finanzas-web
pnpm lint
pnpm build
```

Repositorio:

```text
git diff --check
```

Si una comprobación falla, Antigravity debe corregirla o informar el bloqueo exacto; nunca ocultar el fallo ni marcar la tarea como terminada.

## Formato de entrega de Antigravity

```text
Tarea:
Comportamiento implementado:
Archivos modificados:
Pruebas ejecutadas y resultado:
Riesgos o decisiones pendientes:
Commit o rama:
```

## Criterio de aceptación

Una tarea está lista cuando cumple el alcance solicitado, conserva los contratos existentes, pasa las comprobaciones correspondientes, no expone secretos, funciona en los estados principales y deja un diff pequeño y explicable.
