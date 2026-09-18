# Dashboard financiero

Los tres endpoints requieren un token Bearer de Sanctum y validan sus parámetros con Form Requests.

## Endpoints

| Método y ruta | Resultado | Consultas SQL |
|---|---|---:|
| `GET /api/dashboard/resumen?anio=2026&mes=5` | Totales del mes y acumulados de enero a mayo | 1 |
| `GET /api/dashboard/egresos-por-categoria?anio=2026&mes=5` | Egresos de mayo agrupados y ordenados por categoría | 1 |
| `GET /api/dashboard/resumen-anual?anio=2026` | Ingresos, egresos y balance de los doce meses | 1 |

Los montos se devuelven como cadenas con dos decimales. Esto evita que JSON transforme, por ejemplo, `100.00` en `100` y mantiene el mismo formato que los modelos de ingresos y egresos.

## Por qué el acumulado termina en el mes solicitado

La consulta del resumen recibe dos límites: el 1 de enero y el último día del mes solicitado. Por ejemplo, para mayo de 2026 utiliza el intervalo `2026-01-01` a `2026-05-31`. Un registro de julio nunca entra al conjunto que se suma.

Ingresos y egresos se combinan con `UNION ALL` dentro de una subconsulta. La consulta exterior calcula los cuatro totales con sumas condicionales. Así se obtiene todo el resumen en un solo viaje a MySQL.

## Equivalente SQL de egresos por categoría

La consulta Eloquent está en `DashboardController::egresosPorCategoria`. Su equivalente para MySQL Workbench es:

```sql
SELECT
    categorias.id AS categoria_id,
    categorias.nombre,
    SUM(egresos.monto) AS total
FROM egresos
INNER JOIN categorias
    ON categorias.id = egresos.categoria_id
WHERE egresos.user_id = :user_id
  AND egresos.fecha BETWEEN :inicio_mes AND :fin_mes
GROUP BY categorias.id, categorias.nombre
ORDER BY total DESC;
```

Reemplaza `:user_id`, `:inicio_mes` y `:fin_mes` por datos de prueba. El filtro `egresos.user_id` es el que impide mezclar información de dos usuarios.

## Cómo aparecen los meses vacíos

MySQL devuelve únicamente los meses con movimientos. Después, PHP crea primero los números del 1 al 12 con valores `0.00` y sustituye solo los meses encontrados por sus totales reales. Por eso junio sigue ocupando la sexta posición aunque no tenga registros, algo necesario para que la gráfica conserve sus doce puntos.

## Verificación del error de acumulado

La prueba automatizada crea movimientos de enero, mayo y julio, pide el resumen de mayo y comprueba que:

- el total mensual contiene únicamente mayo;
- el acumulado contiene enero y mayo;
- julio queda fuera;
- los movimientos de otro usuario quedan fuera;
- un mes sin ingresos devuelve porcentaje `0.00` sin división por cero.
