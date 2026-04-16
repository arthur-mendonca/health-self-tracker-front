FROM node:20-alpine AS builder

WORKDIR /app

# O Coolify irá utilizar esses arquivos para identificar dependencias
COPY package.json package-lock.json* ./

# Instala via NPM oficial de forma limpa e rápida (bypass do deno que congela o build no CI)
RUN npm ci

COPY . .

# Build the app
RUN npm run build

# Remove non-production dependencies to keep image small
RUN npm prune --production

# ─── Production ───────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy built assets
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["node", "build/index.js"]
