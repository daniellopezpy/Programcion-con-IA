FROM node:24-bookworm-slim AS frontend
WORKDIR /build
RUN npm install --global pnpm@11.25.0
COPY finanzas-web/package.json finanzas-web/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY finanzas-web/index.html finanzas-web/vite.config.js ./
COPY finanzas-web/public ./public
COPY finanzas-web/src ./src
ENV VITE_API_URL=/api
RUN pnpm build

FROM php:8.4-apache-bookworm
WORKDIR /var/www/saldo
ENV APP_ENV=production APP_DEBUG=false LOG_CHANNEL=stderr
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates unzip \
    && rm -rf /var/lib/apt/lists/* \
    && docker-php-ext-install bcmath opcache pdo_mysql \
    && a2enmod rewrite \
    && sed -i 's/^Listen 80$/Listen 8080/' /etc/apache2/ports.conf

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY finanzas-api/composer.json finanzas-api/composer.lock ./
RUN composer install --no-dev --prefer-dist --no-interaction --no-progress --no-scripts --no-autoloader

COPY finanzas-api/artisan ./artisan
COPY finanzas-api/app ./app
COPY finanzas-api/bootstrap ./bootstrap
COPY finanzas-api/config ./config
COPY finanzas-api/database/migrations ./database/migrations
COPY finanzas-api/database/seeders/CategoriaSeeder.php ./database/seeders/CategoriaSeeder.php
COPY finanzas-api/public ./public
COPY finanzas-api/resources ./resources
COPY finanzas-api/routes ./routes
COPY --from=frontend /build/dist/ ./public/
COPY deploy/render/apache.conf /etc/apache2/sites-available/000-default.conf
COPY deploy/render/start.sh /usr/local/bin/saldo-start

RUN mkdir -p storage/app/private storage/app/public storage/framework/cache/data \
        storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && composer dump-autoload --no-dev --optimize \
    && chown -R www-data:www-data storage bootstrap/cache \
    && sed -i 's/\r$//' /usr/local/bin/saldo-start \
    && chmod 755 /usr/local/bin/saldo-start \
    && apache2ctl configtest

EXPOSE 8080
CMD ["saldo-start"]
