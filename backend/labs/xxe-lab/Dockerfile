FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    libxml2-dev \
    && docker-php-ext-install soap \
    && a2enmod rewrite \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN echo "libxml_disable_entity_loader(0);" >> /usr/local/etc/php/php.ini-development

COPY php.ini /usr/local/etc/php/conf.d/xxe.ini

COPY src/ /var/www/html/

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

EXPOSE 80

CMD ["apache2-foreground"]
