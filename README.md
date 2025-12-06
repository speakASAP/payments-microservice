# Payment Microservice

Centralized payment service for the Statex microservices ecosystem. Handles payment processing via multiple payment providers including PayPal, Stripe, PayU, Fio Banka, and ComGate.

## Features

- ✅ **Multiple Payment Methods** - PayPal, Stripe, PayU, Fio Banka, ComGate, and generic card payments
- ✅ **Unified API** - Single API for all payment methods
- ✅ **Webhook Support** - Automatic payment status updates via webhooks
- ✅ **Refund Support** - Full and partial refunds
- ✅ **Secure** - API key authentication and webhook signature verification
- ✅ **Database Integration** - PostgreSQL storage for payment records
- ✅ **Comprehensive Logging** - Centralized logging via external logging microservice
- ✅ **Transaction History** - Complete audit trail of all payment transactions

## Technology Stack

- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL (via shared database-server)
- **ORM**: TypeORM
- **Payment Providers**: PayPal, Stripe, PayU, Fio Banka, ComGate
- **Logging**: External centralized logging microservice with local fallback

## API Endpoints

### Payment Endpoints

#### POST /payments/create

Create a new payment request.

**Headers:**

- `X-API-Key: <your-api-key>`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "orderId": "string",
  "applicationId": "string",
  "amount": 1000.00,
  "currency": "CZK",
  "paymentMethod": "payu|stripe|paypal|fiobanka|comgate|card",
  "callbackUrl": "https://app.statex.cz/api/payments/callback",
  "customer": {
    "email": "customer@example.com",
    "name": "John Doe",
    "phone": "+420123456789"
  },
  "metadata": {}
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "status": "pending",
    "redirectUrl": "https://payu.cz/...",
    "expiresAt": "2025-01-01T12:00:00Z"
  }
}
```

#### GET /payments/:paymentId

Get payment status.

**Headers:**

- `X-API-Key: <your-api-key>`

**Response:**

```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "orderId": "string",
    "status": "completed",
    "amount": 1000.00,
    "currency": "CZK",
    "paymentMethod": "payu",
    "providerTransactionId": "string",
    "createdAt": "2025-01-01T10:00:00Z",
    "completedAt": "2025-01-01T10:05:00Z"
  }
}
```

#### POST /payments/:paymentId/refund

Refund a payment (full or partial).

**Headers:**

- `X-API-Key: <your-api-key>`
- `Content-Type: application/json`

**Request Body:**

```json
{
  "amount": 500.00,
  "reason": "Customer request"
}
```

### Webhook Endpoints

#### POST /webhooks/paypal

PayPal webhook handler

#### POST /webhooks/stripe

Stripe webhook handler

#### POST /webhooks/payu

PayU webhook handler

#### POST /webhooks/fiobanka

Fio Banka webhook handler

#### POST /webhooks/comgate

ComGate webhook handler

### Health Endpoint

#### GET /health

Returns service health status.

**Response:**

```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "service": "payments-microservice"
}
```

## Configuration

### Environment Variables

**Important**: The `.env` file is the single source of truth for all configuration. All hardcoded values have been replaced with environment variables.

See `.env.example` for all required environment variable names (keys only, no values).

#### Service Configuration

- `SERVICE_PORT` - Internal service port (default: 3468)
- `PORT_BLUE` - Blue deployment external port (default: 3369)
- `PORT_GREEN` - Green deployment external port (default: 3369)
- `NODE_ENV` - Node environment (production/development)
- `SERVICE_NAME` - Service name identifier

#### Database Configuration

- `DB_HOST` - Database host (required, no default)
- `DB_PORT` - Database port (default: 5432)
- `DB_USER` - Database user (required, no default)
- `DB_PASSWORD` - Database password (required, no default)
- `DB_NAME` - Database name (required, no default)
- `DB_SYNC` - TypeORM synchronize option (true/false)

#### Docker Configuration

- `NGINX_NETWORK_NAME` - Docker network name (default: nginx-network)
- `DOCKER_VOLUME_BASE_PATH` - Base path for Docker volumes (default: /srv/storagebox/statex/docker-volumes)

#### Service URLs

- `API_URL` - API gateway URL
- `FRONTEND_URL` - Frontend URL
- `CORS_ORIGIN` - CORS allowed origin
- `LOGGING_SERVICE_URL` - External logging service URL
- `LOGGING_SERVICE_INTERNAL_URL` - Internal logging service URL (default: `http://logging-microservice:${LOGGING_SERVICE_PORT:-3367}`, port configured in logging-microservice/.env)
- `NOTIFICATION_SERVICE_URL` - Notification service URL
- `AUTH_SERVICE_URL` - Authentication service URL

#### Payment Provider Configuration

**PayU:**

- `PAYU_MERCHANT_ID` - PayU merchant ID
- `PAYU_POS_ID` - PayU POS ID
- `PAYU_CLIENT_ID` - PayU client ID
- `PAYU_CLIENT_SECRET` - PayU client secret
- `PAYU_API_URL` - PayU API URL
- `PAYU_API_URL_PRODUCTION` - PayU production API URL (default: <https://secure.payu.com>)
- `PAYU_API_URL_SANDBOX` - PayU sandbox API URL (default: <https://secure.snd.payu.com>)
- `PAYU_SANDBOX` - Enable PayU sandbox mode (true/false)

**ComGate:**

- `COMGATE_MERCHANT_ID` - ComGate merchant ID
- `COMGATE_SECRET_KEY` - ComGate secret key
- `COMGATE_TEST_MODE` - ComGate test mode (true/false)
- `COMGATE_API_URL` - ComGate API base URL (default: <https://payments.comgate.cz/v1.0>)
- `COMGATE_REDIRECT_BASE_URL` - ComGate redirect base URL (default: <https://payments.comgate.cz/v1.0>)

**Fio Banka:**

- `FIO_BANKA_API_KEY` - Fio Banka API key
- `FIO_BANKA_ACCOUNT_NUMBER` - Fio Banka account number
- `FIO_BANKA_API_URL` - Fio Banka API base URL (default: <https://www.fio.cz/ib_api/rest>)
- `QR_CODE_API_URL` - QR code generation API URL (default: <https://api.qrserver.com/v1/create-qr-code>)

**PayPal:**

- `PAYPAL_CLIENT_ID` - PayPal client ID
- `PAYPAL_CLIENT_SECRET` - PayPal client secret
- `PAYPAL_MODE` - PayPal mode (sandbox/live)

**Stripe:**

- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret

#### Security

- `API_KEYS` - Comma-separated list of valid API keys
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRES_IN` - JWT expiration time

#### Logging

- `LOG_LEVEL` - Log level (debug/info/warn/error)

## Deployment

### Prerequisites

- Docker and Docker Compose
- Access to `nginx-network` Docker network
- PostgreSQL database (shared database-server)
- Environment variables configured in `.env`

### Deploy

```bash
# Edit .env with your configuration
nano .env

# Deploy
./scripts/deploy.sh
```

### Check Status

```bash
./scripts/status.sh
```

## 🔌 Port Configuration

**Port Range**: 33xx (shared microservices)

| Service | Host Port (Blue/Green) | Container Port | .env Variable | Description |
|---------|----------------------|----------------|---------------|-------------|
| **Payment Service** | `${PORT_BLUE:-3369}` / `${PORT_GREEN:-3369}` | `${SERVICE_PORT:-3468}` | `PORT_BLUE`, `PORT_GREEN`, `SERVICE_PORT` (payments-microservice/.env) | Payment processing service |

**Note**:

- All ports are configured in `payments-microservice/.env`. The values shown are defaults.
- Blue and green deployments use the same host port (${PORT_BLUE:-3369} / ${PORT_GREEN:-3369}) - only one is active at a time
- Container port (${SERVICE_PORT:-3468}) differs from host port for internal consistency
- All ports are exposed on `127.0.0.1` only (localhost) for security
- External access is provided via nginx-microservice reverse proxy at `https://payments.statex.cz`

## Access Methods

### Production Access (HTTPS)

```bash
curl https://payments.statex.cz/health
```

### Docker Network Access

```bash
# From within a container on nginx-network
# Port configured in payments-microservice/.env: SERVICE_PORT (default: 3468)
curl http://payments-microservice:${SERVICE_PORT:-3468}/health
```

## Integration Example

```typescript
// Example: Creating a payment
const response = await fetch('https://payments.statex.cz/payments/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key',
  },
  body: JSON.stringify({
    orderId: 'order-123',
    applicationId: 'e-commerce',
    amount: 1000.00,
    currency: 'CZK',
    paymentMethod: 'payu',
    callbackUrl: 'https://app.statex.cz/api/payments/callback',
    customer: {
      email: 'customer@example.com',
      name: 'John Doe',
    },
  }),
});

const { data } = await response.json();
// Redirect user to data.redirectUrl for payment
```

## Logs

The service uses a centralized logging system that integrates with the external logging microservice. Logs are sent to the logging microservice via HTTP API and also stored locally as a fallback.

### Logging Configuration

- **External Logging**: Logs are sent to `http://logging-microservice:${PORT:-3367}/api/logs` (port configured in `logging-microservice/.env`)
- **Local Fallback**: If the logging service is unavailable, logs are written to local files in `./logs/` directory
- **Service Name**: All logs are tagged with service name `payments-microservice`

## Security

- **API Key Authentication**: All payment endpoints require valid API key
- **Webhook Signature Verification**: All webhook endpoints verify provider signatures
- **Rate Limiting**: Built-in rate limiting (100 requests per minute)
- **HTTPS**: All production communication uses HTTPS

## Support

For issues and questions, please refer to the main README.md or open an issue on GitHub.
