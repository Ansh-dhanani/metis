# ============================================================
# Metis Hire — Frontend Dockerfile
# Node 20 / Next.js 16 (standalone output)
# ============================================================

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# ── Stage 1: Install dependencies ───────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps --ignore-scripts

# ── Stage 2: Build ──────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* and auth variables are inlined at build time by Next.js.
# Pass these as build args and set as ENV.
ARG NEXT_PUBLIC_API_URL=http://localhost:5000
ARG NEXT_PUBLIC_WS_URL=http://localhost:5000
ARG NEXTAUTH_URL=http://localhost:3000
ARG NEXTAUTH_SECRET=default-secret-change-in-production

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Stage 3: Production runner ───────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Least-privilege user
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Prerender cache directory — owned by the app user
RUN mkdir .next && chown nextjs:nodejs .next

# Leverage Next.js standalone output to keep the image lean
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
