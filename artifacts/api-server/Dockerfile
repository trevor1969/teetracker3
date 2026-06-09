# =============================================================================

# Dockerfile für den API-Server (Express.js + TypeScript)

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


# Abhängigkeiten für den Build (inkl. pnpm-workspace)

COPY ../../package.json ../../pnpm-workspace.yaml ../../pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile


# Quellcode kopieren

COPY ../../lib ./../../lib

COPY . .


# TypeScript-Check (optional, nur für Debugging)

# RUN pnpm run typecheck


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

COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./

RUN pnpm install --prod --frozen-lockfile


# Gebündelten Code aus dem Builder kopieren

COPY --from=builder /app/dist ./dist

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
