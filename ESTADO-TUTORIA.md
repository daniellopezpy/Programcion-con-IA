# Semanas 2, 3 y 4

El tutor implementa lo solicitado por el documento, explica cada bloque y valida la comprensión del usuario. El usuario puede pedir explicaciones adicionales sobre cualquier archivo.

## Preparación técnica realizada
- PHP 8.4.24 existente y extensiones verificadas.
- Composer local en .tools/composer.phar.
- Laravel 13 creado en finanzas-api, dependencias instaladas.
- MySQL 8.4.11 local en .tools; escucha en 127.0.0.1:3306.
- Base finanzas_personales y usuario exclusivo configurados en finanzas-api/.env.
- Conexión comprobada con artisan db:show.
- iniciar-entorno.ps1 inicia MySQL si es necesario y el servidor de Laravel.
- .tools y .env excluidos de Git. Credencial administrativa local en .tools/mysql-root-password.txt.
- Laravel Boost 2.8.1 instalado como dependencia de desarrollo.
- Base de pruebas separada: finanzas_personales_testing.

## Implementación terminada
- P2.2: modelo de datos documentado.
- P2.3: migraciones de categorias, subcategorias y egresos.
- P2.4: modelos y relaciones; Egreso incluye casts y scope delMes.
- P2.5: CategoriaSeeder idempotente con 15 categorías y 24 subcategorías.
- Migraciones ejecutadas en MySQL y seeder ejecutado dos veces sin duplicados.
- Pruebas: 4 aprobadas, 10 aserciones.
- P2.6: factories y datos de prueba para Ana y Luis; junio de 2026 queda vacío.
- P2.7: CRUD completo de egresos con filtros y aislamiento por usuario.
- P2.8: colección Bruno con variables, tokens y pruebas de aislamiento.
- P2.9: migración, modelo, validación y CRUD completo de ingresos.
- P3.1: Form Requests en español para ingresos, egresos y categorías.
- P3.2: Sanctum con registro, login y revocación del token actual.
- P3.3: prueba manual y automatizada de aislamiento, incluido un caso 404.
- P3.4: relaciones completas y carga previa de categoría/subcategoría.
- P3.5: catálogo de categorías del sistema y propias en una sola consulta.
- P3.6: auditoría documentada; cuatro hallazgos pendientes de decisión.
- P4.1: resumen mensual y acumulado, con corte correcto en el mes solicitado.
- P4.2: egresos agrupados por categoría, ordenados de mayor a menor.
- P4.3: resumen anual de doce posiciones, incluidos los meses vacíos.
- P4.4: totales verificados con casos de prueba deterministas.
- P4.5: prueba específica que impide incluir julio en el acumulado de mayo.
- Cada endpoint del dashboard usa una sola consulta SQL y filtra por el usuario autenticado.
- Documentación y SQL equivalente: finanzas-api/docs/DASHBOARD.md.
- Verificación del backend: 20 pruebas PHP, 92 aserciones; el estado más reciente comunicado incluye 8 de 8 solicitudes Bruno aprobadas.

## Pendiente antes de Semana 6
- Revisar y decidir las correcciones de la auditoría P3.6.
- El esquema-bd.sql de referencia no se ha proporcionado.

## Semana 6 - continuidad (2026-09-21)

### Backend previo
- El backend de Laravel de semanas 2 a 4 está implementado en `finanzas-api`.
- El estado más reciente comunicado durante la preparación de la demostración es 20 pruebas PHP aprobadas y 8 solicitudes Bruno aprobadas. La cifra de 7/7 indicada arriba quedó desactualizada.
- Bruno ya fue instalado y usado para validar inicio de sesión y resumen mensual; quitarlo de pendientes.
- El backend y el frontend deben permanecer como repositorios separados, según la guía de Semana 6.

### Semana 6: frontend React
- [x] Frontend separado en `finanzas-web`, con Vite y React en JavaScript/JSX (sin TypeScript), y repositorio Git propio.
- [x] P6.1: Tailwind CSS v4 y su plugin Vite, alias `@` en Vite/jsconfig, configuración de componentes JavaScript y botón compartido.
- [x] P6.2: cliente API con URL configurable, Bearer token, GET/POST/PUT/DELETE, respuestas 204, mensajes de error y eliminación de sesión en 401.
- [x] P6.3: registro/login/logout y restauración/validación de sesión con `/api/user`.
- [x] P6.4: React Router con rutas públicas y protegidas, layout de autenticación y navegación privada.
- [x] P6.5: panel, listas de ingresos y egresos; filtros mensuales y estados de carga, error y lista vacía.
- [x] P6.6: formulario de creación/edición de egresos, selección de categoría/subcategoría y errores de validación del backend.
- [x] P6.7: revisión de rutas, aislamiento de la sesión y sincronía de endpoints; agregado `GET /api/user` protegido para validar tokens al recargar.
- [x] P6.8: README con instalación, ejecución, proxy local, build y advertencia sobre secretos `VITE_`.
- [x] Verificación frontend: `pnpm lint` y `pnpm build` completados correctamente.
- [x] Registro abierto en navegador sin errores de consola; proxy Vite→Laravel verificado y `/api/user` exige autenticación (401 sin token).
- [x] Entorno local reactivado: MySQL escucha en `127.0.0.1:3306`, Laravel en `127.0.0.1:8000` y Vite en `localhost:5173`.
- [x] Verificación backend repetida: 20 pruebas aprobadas, 92 aserciones.
- [ ] Recorrer login y operaciones autenticadas contra MySQL con una sesión válida desde la interfaz.

### Para retomar
- El frontend vive en `finanzas-web` y el backend Laravel en `finanzas-api`, dentro del repositorio público `daniellopezpy/Programcion-con-IA`.
- No explicar el código durante la ejecución salvo que el usuario lo pida; realizar cambios y reservar la explicación para cuando la solicite.
- Reglas conservadas: montos como cadenas decimales, fecha como fuente del mes, consultas filtradas por el usuario autenticado y validación en Form Requests Laravel.
- [x] Se creó `finanzas.code-workspace` para abrir backend y frontend juntos en Visual Studio Code.
- [x] El frontend quedó integrado al repositorio principal y VS Code reconoce la rama `main`.
- [x] Repositorio publicado en GitHub: `https://github.com/daniellopezpy/Programcion-con-IA`.
