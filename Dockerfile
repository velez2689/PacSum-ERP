# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Configure npm with extended timeout
RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Configure npm with extended timeout
RUN npm config set fetch-timeout 120000 && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production --legacy-peer-deps

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production
ENV PORT=3001
ENV NEXT_PUBLIC_API_URL=http://localhost:3001

# Start application
CMD ["npm", "start"]
