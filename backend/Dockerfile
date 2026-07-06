# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Required for Prisma native binaries + bcrypt
RUN apk add --no-cache openssl libc6-compat python3 make g++

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json yarn.lock ./
COPY prisma ./prisma/

# Install ALL deps (including devDeps needed for tsc), skip postinstall
RUN yarn install --frozen-lockfile --ignore-scripts --network-timeout 300000

# Copy source and compile
COPY . .
RUN yarn prisma-generate
RUN npx tsc
# Copy non-TS assets to dist
RUN cp -R src/public dist/ 2>/dev/null || true
RUN cp -R src/Config dist/ 2>/dev/null || true
RUN cp -R src/locales dist/ 2>/dev/null || true

# ─── Stage 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat dumb-init

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

WORKDIR /app

# Copy only production deps (skip postinstall – tsc not available here)
COPY package.json yarn.lock ./
COPY prisma ./prisma/
RUN yarn install --frozen-lockfile --production --ignore-scripts --network-timeout 300000 && \
    PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate && \
    yarn cache clean

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Fix ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

EXPOSE 5000

# dumb-init handles PID 1 / signal forwarding properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
