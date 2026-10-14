# Saldo - frontend de finanzas personales

Aplicación web para consultar el resumen financiero personal y administrar egresos. El frontend está construido con React 19 y Vite; se comunica con el backend Laravel mediante su API JSON.

## Requisitos

- Node.js 22.12 o posterior (desarrollo realizado con Node.js 24.19).
- pnpm 11 o posterior.
- El backend Laravel debe estar configurado y accesible en `http://127.0.0.1:8000`.

## Instalación

Desde la carpeta `finanzas-web`:

```sh
pnpm install
```

Crea un archivo `.env.local` a partir de `.env.example` y ajusta `VITE_API_URL` si la API no usa la configuración local.

En PowerShell:

```powershell
Copy-Item .env.example .env.local
```

En macOS o Linux:

```sh
cp .env.example .env.local
```

## Configurar la API

En desarrollo, `.env.local` puede usar:

```dotenv
VITE_API_URL=/api
```

Vite reenvía las solicitudes que comienzan con `/api` a `http://127.0.0.1:8000`. Para otra instalación, configura la URL base de la API, por ejemplo `VITE_API_URL=https://api.ejemplo.com/api`, y prepara CORS en el servidor Laravel para permitir el origen del frontend.

Las variables que comienzan con `VITE_` quedan incluidas en el código del navegador al generar la aplicación. **No pongas contraseñas, tokens privados, claves de base de datos ni otros secretos en ellas.**

## Iniciar en desarrollo

1. Inicia el backend desde la carpeta `finanzas-api` con `php artisan serve` y confirma que la base de datos esté activa.
2. En otra terminal, desde `finanzas-web`, ejecuta:

```sh
pnpm dev
```

Abre la dirección local que muestra Vite, normalmente `http://localhost:5173`.

## Generar y revisar el build

```sh
pnpm build
pnpm preview
```

El primer comando crea los archivos de producción en `dist`; el segundo inicia una vista local de ese build.

## Funciones incluidas

- Registro, inicio y cierre de sesión con tokens Sanctum.
- Rutas públicas y rutas protegidas.
- Resumen mensual, listado de ingresos y listado de egresos.
- Creación y edición de egresos con catálogos de categorías y subcategorías del backend.
- Estados de carga, error y lista vacía; mensajes de validación Laravel por campo.

La sesión se conserva en `localStorage` para sobrevivir una recarga y se borra al recibir una respuesta `401`. Esta opción facilita el flujo de una aplicación educativa con Bearer tokens; un sistema de producción debe evaluar cookies `HttpOnly` y protección contra XSS.
