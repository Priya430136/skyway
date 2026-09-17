# Multi-stage Dockerfile for SkyWay Airlines (Node.js + TanStack Start)

# --- Stage 1: Dependencies ---
FROM node:22-alpine AS deps
WORKDIR /app

# Install build tools if required by native modules
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# --- Stage 2: Builder ---
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://skyway_admin:skyway_secure_pass@postgres:5432/skyway_airlines
RUN npm run prisma:generate
RUN npm run build

# --- Stage 3: Runner ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Add a non-root system user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 skyway

# Copy required artifacts from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER skyway

EXPOSE 3000

# Start command
CMD ["npm", "start"]
