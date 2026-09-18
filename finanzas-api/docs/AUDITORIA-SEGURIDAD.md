# Auditoría de seguridad del backend

Fecha: 11 de septiembre de 2026.

## Resultado principal

No se encontró una ruta que permita a un usuario leer, modificar o eliminar movimientos de otro usuario. Los controladores parten siempre de la relación del usuario autenticado y responden `404` cuando el identificador no pertenece a esa cuenta.

La contraseña y el token de recuerdo están ocultos por el modelo `User`. El token Bearer completo solo se entrega en el momento de registro o inicio de sesión.

## Hallazgos pendientes

### 1. Riesgo alto si el seeder de demostración se ejecuta en producción

- `database/seeders/DatosPruebaSeeder.php:26` contiene una contraseña conocida para las cuentas de prueba.
- `database/seeders/DatabaseSeeder.php:19` ejecuta ese seeder sin comprobar el entorno.

En desarrollo esto es intencional. En producción crearía cuentas predecibles que cualquier persona podría utilizar. Antes de desplegar, el seeder de demostración debe quedar limitado al entorno local o separarse del `DatabaseSeeder` general.

### 2. Inicio de sesión y registro sin límite explícito de intentos

- `routes/api.php:9`
- `routes/api.php:10`

Las rutas públicas no declaran un límite específico. Un atacante podría realizar muchos intentos de contraseña o registros automatizados. Debe añadirse una política de `throttle` apropiada antes de publicar la API.

### 3. Una categoría en uso puede cambiar de tipo

- `app/Http/Requests/CategoriaRequest.php:38`
- `app/Http/Controllers/CategoriaController.php:62-65`

La validación permite cambiar una categoría personal de `egreso` a `ingreso` aunque tenga movimientos asociados. Esto no expone datos de otro usuario, pero rompe la coherencia del historial. Debe impedirse el cambio de tipo cuando existan ingresos o egresos relacionados.

### 4. La eliminación de categorías captura cualquier error de base de datos

- `app/Http/Controllers/CategoriaController.php:79-81`

Todo `QueryException` se convierte en el mensaje “la categoría está en uso”. Eso puede ocultar una falla distinta de infraestructura. Conviene reconocer únicamente el error de restricción de llave foránea y dejar que otros errores se registren normalmente.

## Controles comprobados

- Todas las rutas de categorías, ingresos y egresos usan `auth:sanctum`.
- `index`, `show`, `update` y `destroy` filtran por el usuario autenticado.
- Las categorías aceptadas por movimientos son del sistema o del usuario actual.
- Las subcategorías deben pertenecer a la categoría enviada.
- Las consultas cargan relaciones previamente para evitar N+1.
- Las respuestas del usuario no incluyen el hash de la contraseña.
- `logout` revoca solamente el token utilizado en esa solicitud.
- Las pruebas automáticas y la colección de Bruno verifican el aislamiento entre Ana y Luis.

Los hallazgos se documentaron sin corregirlos, tal como solicita P3.6.
