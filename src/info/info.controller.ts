/**
 * Info Controller
 * Provides service information and API documentation endpoints
 */

import { Controller, Get } from '@nestjs/common';

@Controller()
export class InfoController {
  @Get()
  getServiceInfo() {
    return {
      service: 'payments-microservice',
      description: 'Centralized payment service for processing payments via multiple payment providers (PayPal, Stripe, PayU, Fio Banka, ComGate)',
      version: '1.0.0',
      status: 'operational',
      endpoints: {
        health: '/health',
        api: '/api/',
        createPayment: 'POST /payments/create',
        getPaymentStatus: 'GET /payments/:paymentId',
        refundPayment: 'POST /payments/:paymentId/refund',
        webhooks: 'POST /webhooks/:provider',
      },
      documentation: {
        healthCheck: 'GET /health - Check service health status',
        createPayment: 'POST /payments/create - Create a new payment request (requires X-API-Key header)',
        getPaymentStatus: 'GET /payments/:paymentId - Get payment status by ID (requires X-API-Key header)',
        refundPayment: 'POST /payments/:paymentId/refund - Refund a payment (requires X-API-Key header)',
        webhooks: 'POST /webhooks/:provider - Handle payment provider webhooks (paypal, stripe, payu, fiobanka, comgate)',
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('api')
  getApiInfo() {
    return {
      success: true,
      service: 'payments-microservice',
      apiVersion: '1.0.0',
      endpoints: [
        {
          method: 'GET',
          path: '/health',
          description: 'Health check endpoint',
          response: {
            success: true,
            status: 'ok',
            timestamp: 'ISO 8601 string',
            service: 'payments-microservice',
          },
        },
        {
          method: 'POST',
          path: '/payments/create',
          description: 'Create a new payment request',
          requiresAuth: true,
          headers: {
            'X-API-Key': 'string (required) - API key for authentication',
            'Content-Type': 'application/json',
          },
          requestBody: {
            orderId: 'string (required)',
            applicationId: 'string (required)',
            amount: 'number (required)',
            currency: 'string (required) - e.g., CZK, EUR, USD',
            paymentMethod: 'payu|stripe|paypal|fiobanka|comgate|card (required)',
            callbackUrl: 'string (required)',
            customer: {
              email: 'string (required)',
              name: 'string (optional)',
              phone: 'string (optional)',
            },
            metadata: 'object (optional)',
          },
          response: {
            success: true,
            data: {
              paymentId: 'uuid',
              status: 'pending',
              redirectUrl: 'string',
              expiresAt: 'ISO 8601 string',
            },
          },
        },
        {
          method: 'GET',
          path: '/payments/:paymentId',
          description: 'Get payment status by ID',
          requiresAuth: true,
          headers: {
            'X-API-Key': 'string (required) - API key for authentication',
          },
          pathParameters: {
            paymentId: 'string (required) - payment UUID',
          },
          response: {
            success: true,
            data: {
              paymentId: 'uuid',
              orderId: 'string',
              status: 'pending|completed|failed|refunded',
              amount: 'number',
              currency: 'string',
              paymentMethod: 'string',
              providerTransactionId: 'string|null',
              createdAt: 'ISO 8601 string',
              completedAt: 'ISO 8601 string|null',
            },
          },
        },
        {
          method: 'POST',
          path: '/payments/:paymentId/refund',
          description: 'Refund a payment (full or partial)',
          requiresAuth: true,
          headers: {
            'X-API-Key': 'string (required) - API key for authentication',
            'Content-Type': 'application/json',
          },
          pathParameters: {
            paymentId: 'string (required) - payment UUID',
          },
          requestBody: {
            amount: 'number (optional) - partial refund amount, omit for full refund',
            reason: 'string (optional) - refund reason',
          },
          response: {
            success: true,
            data: {
              paymentId: 'uuid',
              status: 'refunded',
              refundedAt: 'ISO 8601 string',
            },
          },
        },
        {
          method: 'POST',
          path: '/webhooks/paypal',
          description: 'Handle PayPal webhook',
          headers: {
            'x-paypal-signature': 'string (required) - webhook signature',
            'Content-Type': 'application/json',
          },
          response: {
            success: true,
          },
        },
        {
          method: 'POST',
          path: '/webhooks/stripe',
          description: 'Handle Stripe webhook',
          headers: {
            'stripe-signature': 'string (required) - webhook signature',
            'Content-Type': 'application/json',
          },
          response: {
            success: true,
          },
        },
        {
          method: 'POST',
          path: '/webhooks/payu',
          description: 'Handle PayU webhook',
          headers: {
            'openpayu-signature': 'string (required) - webhook signature',
            'Content-Type': 'application/json',
          },
          response: {
            success: true,
          },
        },
        {
          method: 'POST',
          path: '/webhooks/fiobanka',
          description: 'Handle Fio Banka webhook',
          headers: {
            'x-fio-signature': 'string (required) - webhook signature',
            'Content-Type': 'application/json',
          },
          response: {
            success: true,
          },
        },
        {
          method: 'POST',
          path: '/webhooks/comgate',
          description: 'Handle ComGate webhook',
          headers: {
            'x-comgate-signature': 'string (required) - webhook signature',
            'Content-Type': 'application/json',
          },
          response: {
            success: true,
          },
        },
      ],
      timestamp: new Date().toISOString(),
    };
  }
}

