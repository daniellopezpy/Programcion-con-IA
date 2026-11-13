#!/bin/sh
set -eu

if [ -z "${APP_KEY:-}" ]; then
    : "${SALDO_APP_KEY_BASE64:?Configura la clave de aplicacion de la beta}"
    export APP_KEY="base64:$SALDO_APP_KEY_BASE64"
fi
: "${DB_DATABASE:?Configura el nombre de la base nueva de la beta}"
: "${DB_USERNAME:?Configura DB_USERNAME en el servicio de Saldo}"
: "${DB_PASSWORD:?Configura DB_PASSWORD en el servicio de Saldo}"

case "${DB_CONNECTION:-}:${DB_HOST:-}" in
    mysql:*.tidbcloud.com) ;;
    *) echo 'Saldo requiere el endpoint de la base nueva en TiDB Cloud.' >&2; exit 1 ;;
esac

if [ -n "${DB_URL:-}" ] || [ -n "${DB_SOCKET:-}" ]; then
    echo 'Configura TiDB con las variables DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME y DB_PASSWORD.' >&2
    exit 1
fi

export APP_URL="${APP_URL:-${RENDER_EXTERNAL_URL:?Configura la URL publica de Saldo}}"
export FRONTEND_URL="${FRONTEND_URL:-$APP_URL}"
export DB_PORT="${DB_PORT:-4000}"
export MYSQL_ATTR_SSL_CA=/etc/ssl/certs/ca-certificates.crt
export MYSQL_ATTR_SSL_VERIFY_SERVER_CERT=true

php artisan migrate --force --no-interaction
php artisan db:seed --class=CategoriaSeeder --force --no-interaction

exec apache2-foreground
