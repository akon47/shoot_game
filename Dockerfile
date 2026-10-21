# Static client served by nginx. Build from this directory:
#   docker build --build-arg APP_VERSION=<tag> -t akon47/shoot-game-web:<tag> .
# APP_VERSION replaces __BUILD__ in index.html so every deploy busts the browser cache of framework.js,
# style.css and the dynamically loaded *_class.js files (see framework.js).
FROM nginx:1.27-alpine
ARG APP_VERSION=dev
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY . /usr/share/nginx/html
RUN sed -i "s/__BUILD__/${APP_VERSION}/g" /usr/share/nginx/html/index.html \
 && rm -rf /usr/share/nginx/html/docker
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
