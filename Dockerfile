FROM denoland/deno:alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies using deno
RUN deno run -A npm:npm install --production=false

# Copy source
COPY . .

# Build the app
RUN deno run -A npm:vite build

# ─── Production ───────────────────────────────────────────────
FROM denoland/deno:alpine

WORKDIR /app

# Copy built assets
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./

ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

CMD ["deno", "run", "--allow-all", "build/index.js"]
