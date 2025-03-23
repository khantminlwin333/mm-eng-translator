#!/bin/sh

# Exit on any error
set -e

# Print environment (excluding sensitive data)
echo "Starting server with:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

# Start the application
exec node server.js 