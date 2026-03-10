# Frontend Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
# Two-stage build:
#   Stage 1 (builder): install Node deps and build the Vite/React SPA.
#   Stage 2 (runtime): serve the static bundle with nginx.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies (copy lock file first for better caching).
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# Copy application source and build.
COPY . .

# VITE_API_BASE can be overridden at build time, e.g.:
#   docker build --build-arg VITE_API_BASE=https://api.example.com .
ARG VITE_API_BASE=http://localhost:5000
ENV VITE_API_BASE=${VITE_API_BASE}

RUN npm run build

# ── Stage 2: runtime (nginx) ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Remove default nginx config and replace with our own.
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the compiled SPA from the builder stage.
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
