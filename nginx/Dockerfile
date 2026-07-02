FROM nginx:1.27-alpine

# 1. Installation des outils nécessaires à l'exécution
RUN apk add --no-cache openssl

COPY default.conf /etc/nginx/conf.d/default.conf

# 2. Création des certificats SSL (Grâce à openssl qu'on vient d'installer)
RUN mkdir -p /etc/nginx/certs
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/certs/nginx-selfsigned.key \
    -out /etc/nginx/certs/nginx-selfsigned.crt \
    -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=Student/CN=camagru"

RUN chown -R 101:101 /etc/nginx/certs /etc/nginx/conf.d
EXPOSE 443