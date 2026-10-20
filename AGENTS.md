# Flujo de trabajo de Saldo Finanzas

## Roles

- Codex actúa como arquitecto: define la solución, divide el trabajo, revisa los cambios y decide si una entrega está lista.
- Antigravity actúa como implementador: modifica archivos, ejecuta las comprobaciones indicadas y entrega un resumen de lo realizado.
- La persona responsable del proyecto aprueba los cambios antes de publicarlos en `main`.

## Reglas del repositorio

- Trabajar con ramas `codex/antigravity/<tarea>` para cada tarea nueva.
- No editar directamente `main` durante la implementación.
- No modificar ni publicar `finanzas-api/.env`, `.tools/`, tokens, contraseñas o archivos generados.
- Mantener backend Laravel y frontend React separados dentro del mismo workspace.
- Conservar los contratos de la API, el aislamiento por usuario y la validación del backend.
- Revisar el diff antes de integrar cualquier rama.

## Verificación mínima

Para cambios de backend:

```text
cd finanzas-api
php artisan test
```

Para cambios de frontend:

```text
cd finanzas-web
pnpm lint
pnpm build
```

Para cualquier cambio:

```text
git diff --check
```

## Entrega de Antigravity

Antes de terminar una tarea, informar:

1. Qué comportamiento cambió.
2. Qué archivos se modificaron.
3. Qué comandos de verificación pasaron.
4. Qué riesgos o decisiones requieren revisión de Codex.

No hacer push a `main` sin revisión del arquitecto.

## Identidad visual

El frontend usa el sistema ThoughtStream: fondo cálido `#FAFAF9`, superficies planas, bordes sutiles, tipografía Libre Baskerville para títulos e Inter para interfaz, sin sombras decorativas ni esquinas redondeadas salvo avatares y elementos funcionales.
