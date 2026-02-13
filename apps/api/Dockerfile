# Dockerfile for Corpus Engine API
FROM node:22-slim AS builder

WORKDIR /app

# Copy root package.json and workspace package.json
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY libs/types/package*.json ./libs/types/
COPY libs/utils/package*.json ./libs/utils/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build workspace (if needed, here we use tsx directly for simplicity, but in real prod we'd build to JS)
# RUN npm run build --workspace=apps/api

FROM node:22-slim

WORKDIR /app

COPY --from=builder /app /app

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npx", "tsx", "apps/api/src/index.ts"]
