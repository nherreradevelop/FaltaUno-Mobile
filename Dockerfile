# FaltaUno - servidor de desarrollo de Expo (Metro) en Docker.
# Solo corre Metro: el development build se sigue instalando en el celular o el emulador con
# "npx expo run:android" (fuera de Docker), y la app descarga el JavaScript de este contenedor.
# La versión de producción de una app móvil no es una imagen de Docker: se compila con EAS Build.

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    EXPO_NO_TELEMETRY=1
WORKDIR /app

FROM base AS dependencias
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS desarrollo
COPY --from=dependencias /app/node_modules ./node_modules
COPY . .
# 8081: Metro (el celular descarga el JavaScript desde acá)
EXPOSE 8081
# --dev-client: la app usa módulos nativos (mapas, selector de fecha), no funciona con Expo Go
CMD ["npx", "expo", "start", "--dev-client", "--host", "lan", "--port", "8081"]
