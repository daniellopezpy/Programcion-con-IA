# Guía breve para el video de la Semana 4

Duración objetivo: aproximadamente 3 minutos.

## 0:00–0:30 — Repositorio y Codex

- Mostrar la carpeta raíz del repositorio y las carpetas `app`, `routes`, `database`, `tests`, `docs` y `bruno`.
- Explicar que Laravel está en `finanzas-api` y que el proyecto está abierto y trabajado desde Codex.
- Mostrar el historial de Git con el primer commit del proyecto.

## 0:30–1:20 — Endpoint

- Abrir `routes/api.php` y señalar las rutas que comienzan con `/api/dashboard`.
- Abrir `DashboardController.php` en el método `resumen`.
- Explicar el recorrido: la ruta recibe la solicitud, Sanctum identifica al usuario, el Form Request valida año y mes, el controlador consulta MySQL y Laravel devuelve JSON.
- Señalar que el acumulado termina en el mes solicitado; mayo no incluye registros de julio.

## 1:20–2:20 — Prueba con Bruno

- Abrir la colección `Finanzas API` y seleccionar el ambiente `Local`.
- Ejecutar primero `01-login-ana` para obtener el token.
- Ejecutar `08-resumen-mayo-ana` y mostrar el código `200` y la respuesta JSON del dashboard.
- Explicar que Bruno actúa como un cliente: envía la solicitud a Laravel y permite inspeccionar la respuesta.

## 2:20–3:00 — Base de datos y reto

- Explicar que MySQL guarda usuarios, categorías, ingresos y egresos, mientras Laravel controla quién puede consultar cada registro.
- Reto sugerido: evitar que Ana pudiera ver datos de Luis. La solución fue construir las consultas desde el usuario autenticado y comprobarlo con pruebas automatizadas.
- Cierre sugerido: el proyecto conecta React en el frontend, Laravel en el backend, MySQL para almacenamiento y JSON para el intercambio de datos.

## Antes de grabar

- Mantener visible el rostro con la cámara de la herramienta de grabación.
- Confirmar que el micrófono se mueve en el medidor de audio.
- No mostrar contraseñas, archivos `.env` ni tokens completos.
- Hacer una prueba corta de diez segundos antes de la toma final.
