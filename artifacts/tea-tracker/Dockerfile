# =============================================================================
# Dockerfile für das Frontend (React + Vite)
# Anpassung für Portainer mit Verzeichnis: /home/teetracker3
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

# Abhängigkeiten für den Build (Root-Package.json + pnpm-workspace)
COPY /home/teetracker3/package.json /home/teetracker3/pnpm-workspace.yaml /home/teetracker3/pnpm-lock.yaml /app/
RUN cd /app && pnpm install --frozen-lockfile

# Quellcode kopieren (lib/ und artifacts/tea-tracker/)
COPY /home/teetracker3/lib /app/lib
COPY /home/teetracker3/artifacts/tea-tracker /app/artifacts/tea-tracker

# Arbeitsverzeichnis für den Build setzen
WORKDIR /app/artifacts/tea-tracker

# Umgebungsvariablen für den Build setzen
ENV NODE_ENV=production
ENV PORT=80
ENV BASE_PATH="/"
ENV VITE_API_URL="http://localhost:5000"

# App bauen (Vite)
RUN pnpm run build

# =============================================================================
# Production-Stage: Nginx für statische Dateien
# =============================================================================
FROM nginx:alpine AS production

# Standard-Nginx-Konfiguration entfernen
RUN rm -rf /usr/share/nginx/html/*

# Gebaute App aus dem Builder kopieren
COPY --from=builder /app/artifacts/tea-tracker/dist/public /usr/share/nginx/html

# Port 80 freigeben (Standard für Nginx)
EXPOSE 80

# Healthcheck (optional)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Nginx starten
CMD ["nginx", "-g", "daemon off;"]
