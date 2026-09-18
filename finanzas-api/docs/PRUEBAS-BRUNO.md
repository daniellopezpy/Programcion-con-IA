# Prueba de aislamiento entre usuarios

La colección `bruno` ejecuta una secuencia completa:

1. Ana inicia sesión y su token se guarda solo como variable temporal.
2. Se consulta el catálogo y se localizan Vivienda e Internet.
3. Ana crea un egreso y se guarda su identificador temporalmente.
4. Luis inicia sesión con un token diferente.
5. Luis intenta consultar el egreso de Ana y debe recibir `404`.
6. El listado de Luis comprueba que tampoco contiene ese egreso.
7. Ana consulta el mismo identificador y recibe `200`.

Se devuelve `404` en lugar de `403` para no confirmar a Luis que existe un registro privado con ese identificador.

## Ejecución

1. Inicia la API con `..\iniciar-entorno.ps1`.
2. Abre en Bruno la carpeta `finanzas-api\bruno`.
3. Selecciona el entorno `Local`.
4. Ejecuta la colección completa en orden.

Los tokens se guardan con `bru.setVar`, por lo que permanecen en memoria durante la ejecución y no se escriben en los archivos del proyecto.
