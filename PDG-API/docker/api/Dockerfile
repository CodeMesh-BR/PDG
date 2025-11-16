FROM php:8.3-apache

RUN apt-get update && apt-get install -y \
  git unzip libpq-dev \
  tesseract-ocr tesseract-ocr-eng tesseract-ocr-por libtesseract-dev \
  imagemagick libmagickwand-dev libjpeg-dev libpng-dev \
  && docker-php-ext-install bcmath pdo pdo_pgsql \
  && pecl install imagick \
  && docker-php-ext-enable imagick \
  && a2enmod rewrite headers \
  && rm -rf /var/lib/apt/lists/*

RUN pecl install protobuf \
  && docker-php-ext-enable protobuf

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY vhost.conf /etc/apache2/sites-available/000-default.conf

WORKDIR /var/www/html
