# Build stage
FROM node:24-alpine AS builder

WORKDIR /app

# Install dependencies from lockfile for reproducible builds
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage: serve static build
FROM node:24-alpine AS runner

WORKDIR /app

# Sevalla sets PORT automatically; default for local runs
ENV PORT=3000

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Lightweight static server with SPA fallback (index.html for client-side routes)
RUN npm init -y && npm install serve

# Listen on PORT so the platform can expose the app
CMD ["sh", "-c", "npx serve -s dist -l $PORT"]
