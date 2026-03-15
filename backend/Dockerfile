# Backend Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
# Multi-stage build to keep the final image lean.
#
# Stage 1 (builder): install Python dependencies into a venv.
# Stage 2 (runtime): copy only the venv and application code.
#
# Required build-time secret / runtime env var:
#   DASHSCOPE_API_KEY — Alibaba Cloud DashScope API key
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: builder ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /build

# Install build tools for compiling native Python extensions.
RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create an isolated virtual environment.
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies first (better layer caching).
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

# Copy the pre-built venv from the builder stage.
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Copy application source.
COPY . .

# Expose Flask port.
EXPOSE 5000

# Non-root user for security.
RUN adduser --disabled-password --gecos "" appuser \
    && chown -R appuser:appuser /app
USER appuser

# Health check.
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/api/health')"

# Use gunicorn for production; fall back to Flask dev server in DEBUG mode.
CMD ["python", "-m", "gunicorn", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120", "app:app"]
