#!/bin/sh
set -eu
cd /root/projects/formulario
if ! dig +short A formulario.jipdev.cloud | grep -qx '143.95.171.121'; then
  echo 'DNS pendente: crie formulario A 143.95.171.121' >&2
  exit 1
fi
certbot certonly --webroot -w /var/www/formulario-acme -d formulario.jipdev.cloud --non-interactive --agree-tos --register-unsafely-without-email
cp deploy/nginx-https.conf /etc/nginx/sites-available/formulario.jipdev.cloud.conf
nginx -t
systemctl reload nginx
