# Dockerfile for Corpus Engine API
FROM node:22-slim AS builder

WORKDIR /app

# Copy everything first to ensure workspaces are found
COPY . .

# Install dependencies (from root)
RUN npm install

# Build workspace (if needed, here we use tsx directly for simplicity, but in real prod we'd build to JS)
# RUN npm run build --workspace=apps/api

FROM node:22-slim

WORKDIR /app

COPY --from=builder /app /app

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npx", "tsx", "apps/api/src/index.ts"]
