#!/bin/bash

# Payment Microservice Status Script
# Checks the status of the payment microservice

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

echo "📊 Payment Microservice Status"
echo "=================================="

# Check if container is running
if docker ps | grep -q payments-microservice; then
  echo "✅ Container is running"
else
  echo "❌ Container is not running"
  exit 1
fi

# Load SERVICE_PORT from .env if available
if [ -f .env ]; then
  source .env
fi
SERVICE_PORT="${SERVICE_PORT:-3468}"

# Check health endpoint
echo ""
echo "🏥 Health Check:"
if docker exec payments-microservice wget --quiet --tries=1 --spider "http://localhost:${SERVICE_PORT}/health" 2>/dev/null; then
  echo "✅ Health endpoint is responding"
  docker exec payments-microservice wget -qO- "http://localhost:${SERVICE_PORT}/health" | jq . 2>/dev/null || docker exec payments-microservice wget -qO- "http://localhost:${SERVICE_PORT}/health"
else
  echo "❌ Health endpoint is not responding"
fi

# Show container status
echo ""
echo "📋 Container Status:"
docker compose ps payment-service

# Show recent logs
echo ""
echo "📝 Recent Logs (last 20 lines):"
docker compose logs --tail=20 payment-service

