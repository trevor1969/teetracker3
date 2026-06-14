FROM node:24-alpine AS base
WORKDIR /app

FROM base AS builder

RUN npm install -g npm@latest

# npm Abhängigkeiten kopieren und installieren
COPY package.json package-lock.json ./
RUN npm install

# Quellcode kopieren
COPY lib ./lib
COPY artifacts/api-server ./artifacts/api-server

# Build
RUN npm run build

FROM base AS production
WORKDIR /app

COPY --from=builder /app/package.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
