# Propuesta de modelo de datos

## Estado

- [x] Identificar las entidades principales.
- [x] Definir propietarios, categorías y subcategorías.
- [x] Definir montos, fechas, índices y reglas de eliminación.
- [x] Implementar las primeras tres migraciones.

## Objetivo

Organizar los datos del sistema antes de construir el CRUD.

## Requisitos para tu propuesta

- Cada usuario ve únicamente sus propios movimientos.
- Se registran ingresos y egresos.
- Las categorías pueden ser de ingreso o de egreso.
- Hay categorías del sistema y categorías creadas por usuarios.
- Las subcategorías pertenecen a una categoría.

## Modelo acordado

| Tabla | ¿Qué información guarda? |
| --- | --- |
| `users` | Cuentas de las personas que utilizan el sistema. |
| `categorias` | Clasificaciones de tipo ingreso o egreso, compartidas o personales. |
| `subcategorias` | Clasificaciones específicas que pertenecen a una categoría. |
| `ingresos` | Dinero recibido por cada usuario; se implementará en el bloque P2.9. |
| `egresos` | Gastos asociados con un usuario, categoría y subcategoría opcional. |

## Decisiones técnicas

- Los montos usan `DECIMAL(12,2)` para mantener dos decimales exactos.
- El mes se deriva de `fecha`; no se almacena en otra columna.
- El índice `(user_id, fecha)` acelera búsquedas de movimientos por propietario y período.
- Las categorías en uso tienen eliminación restringida.
- Al borrar una subcategoría, el egreso se conserva y `subcategoria_id` pasa a `NULL`.
- Al borrar un usuario, sus movimientos y categorías personales se eliminan en cascada.
- Las categorías del sistema tienen `user_id = NULL`.

## Dudas para revisar

Escribe aquí cualquier duda que surja al preparar tu propuesta.
