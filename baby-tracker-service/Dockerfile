FROM node:20-slim AS builder

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies for building
RUN npm install

# Copy source files
COPY src ./src
COPY tsconfig.json ./
COPY scripts ./scripts

# Build TypeScript code
RUN npm run build
RUN npx prisma generate

# Production stage
FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/
COPY scripts ./scripts

# Install only production dependencies
RUN npm install --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Make start script executable
RUN chmod +x ./scripts/start.sh

EXPOSE 3000

CMD ["./scripts/start.sh"] 