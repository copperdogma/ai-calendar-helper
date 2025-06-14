# syntax=docker/dockerfile:1

# -------- Build Stage --------
FROM node:20-alpine AS builder

# Install openssl for Prisma (needed for TLS)
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies (skip platform-specific dev deps)
ENV NODE_ENV=production
# Skip husky git hooks during install
ENV HUSKY=0

# Install production dependencies (include dev for build)
RUN npm ci --omit=optional

# Copy the rest of the project
COPY . .

# Generate Prisma client for correct binary target
RUN npx prisma generate --schema=./prisma/schema.prisma

# Ensure Next.js standalone output enabled and build
RUN npm run build

# -------- Production Stage --------
FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Copy standalone build from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./db

# If using Prisma with Data Proxy, copy generated client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy full node_modules to runner for prisma CLI
COPY --from=builder /app/node_modules ./node_modules

# Copy prisma package to root path to satisfy symlink
COPY --from=builder /app/node_modules/prisma ./prisma

EXPOSE 3000

# Healthcheck – relies on existing /api/health route
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"] 