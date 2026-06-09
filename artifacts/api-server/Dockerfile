# =============================================================================
# Dockerfile für den API-Server (Express.js + TypeScript)
# Anpassung für Portainer mit Verzeichnis: /home/teetracker3
# =============================================================================
# Basis-Image: Node.js 24 (LTS)
FROM node:24-alpine AS base

# Arbeitsverzeichnis
WORKDIR /app

# =============================================================================
# Build-Stage: Abhängigkeiten installieren und Code bündeln
# =============================================================================
FROM base AS builder

# pnpm installieren (für Workspace-Unterstützung)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Abhängigkeiten für den Build (Root-Package.json + pnpm-workspace)
COPY /home/teetracker3/package.json /home/teetracker3/pnpm-workspace.yaml /home/teetracker3/pnpm-lock.yaml /app/
RUN cd /app && pnpm install --frozen-lockfile

# Quellcode kopieren (lib/ und artifacts/api-server/)
COPY /home/teetracker3/lib /app/lib
COPY /home/teetracker3/artifacts/api-server /app/artifacts/api-server

# Arbeitsverzeichnis für den Build setzen
WORKDIR /app/artifacts/api-server

# Code bündeln (esbuild)
RUN pnpm run build

# =============================================================================
# Production-Stage: Nur notwendige Dateien kopieren
# =============================================================================
FROM base AS production

# Arbeitsverzeichnis
WORKDIR /app

# pnpm für Production (falls nötig)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Abhängigkeiten für Production installieren (ohne devDependencies)
COPY --from=builder /app/artifacts/api-server/package.json /app/artifacts/api-server/pnpm-lock.yaml /app/
RUN cd /app && pnpm install --prod --frozen-lockfile

# Gebündelten Code aus dem Builder kopieren
COPY --from=builder /app/artifacts/api-server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Umgebungsvariablen (werden zur Laufzeit überschrieben)
ENV NODE_ENV=production
ENV PORT=5000

# Standardmäßig auf Port 5000 lauschen
EXPOSE 5000

# Healthcheck (optional, für Docker/Kubernetes)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Startbefehl
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
