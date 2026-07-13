FROM php:8.3-cli

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libpq-dev \
    libzip-dev \
    libonig-dev \
    && docker-php-ext-install pdo pdo_pgsql pdo_mysql mbstring zip bcmath \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer dump-autoload --optimize

RUN chmod +x artisan
RUN mkdir -p storage/framework/{cache,sessions,testing,views} storage/logs bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache

EXPOSE 10000

CMD php artisan migrate --force && php artisan serve --host 0.0.0.0 --port 10000