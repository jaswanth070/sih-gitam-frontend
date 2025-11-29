# syntax=docker/dockerfile:1

# Base image aligned with Vercel build pipeline (pnpm 10 via Corepack)
FROM node:22.11.0-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME=/pnpm
ENV PATH="/pnpm:$PATH"
ENV PNPM_VERSION=10.0.0

RUN corepack enable \
	&& corepack prepare pnpm@${PNPM_VERSION} --activate

# Install dependencies with the lockfile (dev deps included for the build)
FROM base AS deps
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Build the Next.js application and prune to production deps
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN pnpm run build
RUN pnpm prune --prod

# Production image running `next start`
FROM node:22.11.0-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
	NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

USER node

EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "--hostname", "0.0.0.0"]