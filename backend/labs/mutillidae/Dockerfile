FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    apache2 \
    php8.1 \
    php8.1-mysql \
    php8.1-gd \
    php8.1-xml \
    php8.1-curl \
    php8.1-mbstring \
    php8.1-zip \
    php8.1-bz2 \
    php8.1-ldap \
    mariadb-server \
    mariadb-client \
    git \
    curl \
    unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/webpwnized/mutillidae.git /var/www/mutillidae || true

COPY setup.sh /setup.sh
RUN chmod +x /setup.sh

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY apache.conf /etc/apache2/sites-available/000-default.conf
COPY php-config.ini /etc/php/8.1/apache2/conf.d/99-mutillidae.ini

RUN a2enmod rewrite && a2enmod headers

EXPOSE 80

CMD ["/entrypoint.sh"]
