# =============================================================================

# Dockerfile für das Frontend (React + Vite)

# =============================================================================

# Basis-Image: Node.js 24 (für Build)

FROM node:24-alpine AS base


# Arbeitsverzeichnis

WORKDIR /app


# =============================================================================

# Build-Stage: Abhängigkeiten installieren und App bauen

# =============================================================================

FROM base AS builder


# pnpm installieren

RUN corepack enable && corepack prepare pnpm@latest --activate


# Abhängigkeiten für den Build (inkl. pnpm-workspace)

COPY ../../package.json ../../pnpm-workspace.yaml ../../pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile


# Quellcode kopieren

COPY ../../lib ./../../lib

COPY . .


# Umgebungsvariablen für den Build setzen

ENV NODE_ENV=production

ENV PORT=80

ENV BASE_PATH="/"


# App bauen (Vite)

RUN pnpm run build


# =============================================================================

# Production-Stage: Nginx für statische Dateien

# =============================================================================

FROM nginx:alpine AS production


# Standard-Nginx-Konfiguration entfernen

RUN rm -rf /usr/share/nginx/html/*


# Gebaute App aus dem Builder kopieren

COPY --from=builder /app/dist/public /usr/share/nginx/html


# Port 80 freigeben (Standard für Nginx)

EXPOSE 80


# Healthcheck (optional)

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \

  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1


# Nginx starten

CMD ["nginx", "-g", "daemon off;"]
