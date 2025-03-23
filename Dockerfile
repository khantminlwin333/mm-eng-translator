FROM node:18-slim

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install --production

# Copy application code
COPY . .

# Set environment variables
ENV NODE_ENV=production \
    PORT=3000

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD curl -f http://localhost:3000/api/health || exit 1

EXPOSE 3000

CMD ["node", "server.js"] 