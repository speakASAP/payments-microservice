#!/bin/bash

# Payment Microservice Deployment Script
# Builds and deploys the payment microservice

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

echo "🚀 Deploying Payment Microservice..."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found"
  echo "Please create .env file from .env.example"
  exit 1
fi

# Build Docker image
echo "📦 Building Docker image..."
docker compose build

# Start services
echo "🚀 Starting services..."
docker compose up -d

# Wait for service to be ready
echo "⏳ Waiting for service to be ready..."
sleep 5

# Health check
echo "🏥 Checking service health..."
SERVICE_PORT="${SERVICE_PORT:-3468}"
MAX_RETRIES=10
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if docker exec payment-microservice wget --quiet --tries=1 --spider "http://localhost:${SERVICE_PORT}/health" 2>/dev/null; then
    echo "✅ Service is healthy!"
    break
  fi

  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "⏳ Waiting for service... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "❌ Service health check failed after $MAX_RETRIES attempts"
  echo "📋 Service logs:"
  docker compose logs --tail=50 payment-service
  exit 1
fi

echo "✅ Deployment completed successfully!"
echo "📋 Service status:"
docker compose ps

