#!/bin/bash

# Payment Microservice Test Script
# Tests the payment microservice endpoints

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

echo "🧪 Testing Payment Microservice"
echo "=================================="

# Load SERVICE_PORT from .env if available
if [ -f .env ]; then
  source .env
fi
SERVICE_PORT="${SERVICE_PORT:-3468}"
BASE_URL="http://localhost:${SERVICE_PORT}"
API_KEY="${API_KEY:-test-api-key}"

# Health check
echo ""
echo "1. Testing health endpoint..."
curl -s "${BASE_URL}/health" | jq . || curl -s "${BASE_URL}/health"
echo ""

# Test payment creation (this will fail without proper API key and provider credentials)
echo "2. Testing payment creation endpoint..."
echo "Note: This requires valid API key and payment provider credentials"
curl -X POST "${BASE_URL}/payments/create" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{
    "orderId": "test-order-123",
    "applicationId": "test-app",
    "amount": 100.00,
    "currency": "CZK",
    "paymentMethod": "payu",
    "callbackUrl": "https://example.com/callback",
    "customer": {
      "email": "test@example.com",
      "name": "Test User"
    }
  }' | jq . || echo "Request failed (expected if API key or provider credentials are not configured)"
echo ""

echo "✅ Test completed"

