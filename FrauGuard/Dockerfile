# sampleRagPipelineWeb Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage build for the Next.js RAG pipeline web interface.
#
# Stage 1 (deps):    install production Node.js dependencies.
# Stage 2 (builder): build the Next.js standalone application.
# Stage 3 (runner):  copy only the standalone output and run the server.
#
# The Next.js config uses output: "standalone" so the final image contains
# only the minimal server and pre-rendered pages — no node_modules bloat.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: install dependencies ────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies needed by native modules (e.g. sharp, prisma).
RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

# ── Stage 2: build the application ───────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars must be available at build time because Next.js inlines
# them into the client-side JavaScript bundle.
ARG NEXT_PUBLIC_API_BASE=http://localhost:5000
ARG NEXT_PUBLIC_GITHUB_REPO_URL=https://github.com/Jendope/FraudGuard
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
ENV NEXT_PUBLIC_GITHUB_REPO_URL=$NEXT_PUBLIC_GITHUB_REPO_URL

# Disable Next.js telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: production runner ───────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user for security.
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Copy the standalone build output.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
