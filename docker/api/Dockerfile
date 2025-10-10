FROM php:8.3-apache

RUN apt-get update && apt-get install -y git unzip libpq-dev \
  && docker-php-ext-install pdo pdo_pgsql \
  && a2enmod rewrite headers \
  && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# VirtualHost apontando para /public
COPY vhost.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html