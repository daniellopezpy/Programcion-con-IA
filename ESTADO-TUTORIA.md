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
- Verificación actual: 20 pruebas PHP, 92 aserciones; 7 de 7 pruebas Bruno aprobadas.

## Pendiente
- Instalar Bruno antes del bloque de pruebas; a cargo del tutor.
- Revisar y decidir las correcciones de la auditoría P3.6.
- Instalar la aplicación gráfica de Bruno si se requiere usar su interfaz.
- El esquema-bd.sql de referencia no se ha proporcionado.
