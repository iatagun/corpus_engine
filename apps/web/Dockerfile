# Dockerfile for Corpus Engine Web Interface (Next.js)
FROM node:22-slim AS builder

WORKDIR /app

# Copy everything first to ensure workspaces are found (Monorepo support)
COPY . .

# Install dependencies (from root)
RUN npm install

# Build the Next.js application
RUN npm run build --workspace=apps/web

# Production Image
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy necessary files for running Next.js
COPY --from=builder /app/apps/web/next.config.ts ./apps/web/
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/.next/standalone ./apps/web/standalone
COPY --from=builder /app/apps/web/.next/static ./apps/web/standalone/apps/web/.next/static

# We need to set the working directory to where the standalone server expects it
WORKDIR /app/apps/web/standalone/apps/web

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
