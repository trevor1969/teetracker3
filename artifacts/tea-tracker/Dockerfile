FROM node:24-alpine AS base
WORKDIR /app

FROM base AS builder

RUN npm install -g npm@latest

# npm Abhängigkeiten kopieren und installieren
COPY package.json package-lock.json ./
RUN npm install

# Umgebungsvariablen für den Build
ENV NODE_ENV=production
ENV PORT=80
ENV BASE_PATH="/"

# Quellcode kopieren
COPY lib ./lib
COPY artifacts/tea-tracker ./artifacts/tea-tracker

# Build
RUN npm run build

FROM nginx:alpine AS production
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist/public /usr/share/nginx/html
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
