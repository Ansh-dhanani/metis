# ============================================================
# Metis Hire — Backend Dockerfile
# Python 3.11 / Flask / Gunicorn
# ============================================================

FROM python:3.11-slim AS base

# Keep Python output unbuffered & disable .pyc file creation
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# ── System deps needed by pdfplumber, pymongo, etc. ─────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpoppler-cpp-dev \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# ── Python dependencies ──────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ── Application source ───────────────────────────────────────
COPY . .

# ── Non-root user for security ───────────────────────────────
RUN addgroup --system appgroup \
    && adduser --system --ingroup appgroup --no-create-home appuser \
    && chown -R appuser:appgroup /app

USER appuser

# ── Runtime config ───────────────────────────────────────────
EXPOSE 5000

ENV FLASK_ENV=production \
    PORT=5000

# Matches the Procfile: 2 workers × 4 threads, 120 s timeout
CMD ["gunicorn", \
     "--workers", "2", \
     "--threads", "4", \
     "--bind", "0.0.0.0:5000", \
     "--timeout", "120", \
     "--log-level", "info", \
     "--access-logfile", "-", \
     "wsgi:app"]
