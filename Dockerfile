# Multi-stage Dockerfile for Angular SSR Application
# Optimized for Google Cloud Run deployment with best practices

# Stage 1: Build Stage
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install ALL dependencies (including dev dependencies needed for build)
# Use npm ci for reproducible builds and clean cache immediately
RUN npm ci --prefer-offline --no-audit && \
    npm cache clean --force

# Copy source code
COPY . .

# Build the Angular SSR application for production
# This will use environment.prod.ts via fileReplacements in angular.json
RUN npm run build:ssr

# Stage 2: Production Stage
FROM node:18-alpine AS production

# Add labels for better container management
LABEL maintainer="resume-maker-fe"
LABEL version="1.0"
LABEL description="Angular SSR application for Resume Maker"

# Install production dependencies for security patches
RUN apk add --no-cache tini dumb-init && \
    rm -rf /var/cache/apk/*

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S angular -u 1001 -G nodejs

# Copy package.json for runtime dependencies
COPY --from=builder --chown=angular:nodejs /app/package*.json ./

# Install only production dependencies with optimizations
RUN npm ci --only=production --prefer-offline --no-audit && \
    npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=angular:nodejs /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Set security headers and optimizations
ENV NODE_OPTIONS="--max-old-space-size=512"

# Switch to non-root user for security
USER angular

# Expose port (Google Cloud Run uses PORT environment variable)
EXPOSE 8080

# Use tini to handle signals properly (PID 1 zombie reaping)
ENTRYPOINT ["/sbin/tini", "--"]

# Start the application
CMD ["node", "dist/resume-maker-fe/server/server.mjs"]