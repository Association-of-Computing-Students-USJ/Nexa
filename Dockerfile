# Build stage: Build the React client
FROM node:20-alpine AS builder

WORKDIR /app

# Copy entire client directory (excluding node_modules and dist via .dockerignore)
COPY client/ ./client/

# Install dependencies and build
WORKDIR /app/client
RUN npm ci && npm run build

# Runtime stage: Serve the built client
FROM node:20-alpine

WORKDIR /app

# Copy the built client from builder stage
COPY --from=builder /app/client/dist ./client/dist

# Copy server code
COPY server.js .
COPY package.json .

# Expose port for Cloud Run
EXPOSE 8080

# Set production environment
ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=1 \
  CMD node -e "require('http').get('http://localhost:8080', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the server
CMD ["node", "server.js"]
