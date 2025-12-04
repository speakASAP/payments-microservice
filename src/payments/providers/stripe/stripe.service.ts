/**
 * Stripe Payment Service
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { LoggerService } from '../../../../shared/logger/logger.service';
import {
  PaymentProvider,
  CreatePaymentRequest,
  CreatePaymentResponse,
  RefundPaymentRequest,
  RefundPaymentResponse,
} from '../payment-provider.interface';

@Injectable()
export class StripeService implements PaymentProvider {
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY') || '';
    const apiVersion = this.configService.get<string>('STRIPE_API_VERSION') || '2023-10-16';
    this.stripe = new Stripe(secretKey, {
      apiVersion: apiVersion as any,
    });
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency.toLowerCase(),
        metadata: {
          orderId: request.orderId,
          callbackUrl: request.callbackUrl,
          ...request.metadata,
        },
        description: `Payment for order ${request.orderId}`,
      });

      // For card payments, we might need to create a checkout session
      // For now, return the client secret for frontend integration
      return {
        paymentId: paymentIntent.id,
        status: paymentIntent.status,
        providerTransactionId: paymentIntent.id,
        // redirectUrl would be set if using Stripe Checkout
      };
    } catch (error) {
      this.logger.error(`Stripe createPayment error: ${error}`, undefined, 'StripeService');
      throw error;
    }
  }

  async getPaymentStatus(providerTransactionId: string): Promise<any> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(providerTransactionId);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Stripe getPaymentStatus error: ${error}`, undefined, 'StripeService');
      throw error;
    }
  }

  async refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    try {
      // First get the payment intent to find the charge
      const paymentIntent = await this.getPaymentStatus(request.paymentId);
      const chargeId = paymentIntent.latest_charge as string;

      if (!chargeId) {
        throw new Error('Charge ID not found in payment intent');
      }

      const refundParams: Stripe.RefundCreateParams = {
        charge: chargeId,
      };

      if (request.amount) {
        refundParams.amount = Math.round(request.amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundParams);

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100, // Convert from cents
      };
    } catch (error) {
      this.logger.error(`Stripe refundPayment error: ${error}`, undefined, 'StripeService');
      throw error;
    }
  }

  verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
    try {
      const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
      this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      return true;
    } catch (error) {
      this.logger.error(`Stripe webhook verification error: ${error}`, undefined, 'StripeService');
      return false;
    }
  }
}

