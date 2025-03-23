FROM node:18-slim

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Create app directory and set permissions
WORKDIR /app
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Install dependencies first (better caching)
COPY --chown=node:node package*.json ./
RUN npm install --production

# Copy application code
COPY --chown=node:node . .

# Set environment variables
ENV NODE_ENV=production \
    PORT=8080

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s \
  CMD curl -f http://localhost:8080/api/health || exit 1

EXPOSE 8080

CMD ["node", "server.js"] 