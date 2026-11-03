# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/editor-core/package*.json ./packages/editor-core/
COPY packages/design-tokens/package*.json ./packages/design-tokens/
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build required packages and API
RUN npm run build --workspace=@pencel/shared-types && \
    npm run build --workspace=@pencel/editor-core && \
    npm run build --workspace=@pencel/api

# Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared-types/package*.json ./packages/shared-types/
COPY packages/editor-core/package*.json ./packages/editor-core/

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built code from builder
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/editor-core/dist ./packages/editor-core/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 4000

CMD ["node", "apps/api/dist/server.js"]
