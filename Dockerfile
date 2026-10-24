# Production Dockerfile for Shopify Engine & Vercel React / dist.zip Hosting
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --prefer-offline || npm install

# Copy source and build frontend bundle
COPY . .
RUN npm run build

# Production runtime stage
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy compiled frontend and server
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/src ./src

# Create directory for persistent deployment caches if needed
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server.js"]
