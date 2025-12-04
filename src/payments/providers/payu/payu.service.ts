/**
 * PayU Payment Service
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import { LoggerService } from '../../../../shared/logger/logger.service';
import {
  PaymentProvider,
  CreatePaymentRequest,
  CreatePaymentResponse,
  RefundPaymentRequest,
  RefundPaymentResponse,
} from '../payment-provider.interface';

@Injectable()
export class PayUService implements PaymentProvider {
  private readonly posId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly merchantId: string;
  private readonly sandbox: boolean;
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logger: LoggerService,
  ) {
    this.posId = this.configService.get<string>('PAYU_POS_ID') || '';
    this.clientId = this.configService.get<string>('PAYU_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('PAYU_CLIENT_SECRET') || '';
    this.merchantId = this.configService.get<string>('PAYU_MERCHANT_ID') || '';
    this.sandbox = this.configService.get<string>('PAYU_SANDBOX') === 'true';
    this.baseUrl = this.sandbox
      ? (this.configService.get<string>('PAYU_API_URL_SANDBOX') || 'https://secure.snd.payu.com')
      : (this.configService.get<string>('PAYU_API_URL_PRODUCTION') || 'https://secure.payu.com');
  }

  private generateSignature(params: Record<string, any>): string {
    // PayU signature generation
    const sortedKeys = Object.keys(params).sort();
    const signatureString = sortedKeys
      .map((key) => `${key}=${params[key]}`)
      .join('&');
    return crypto
      .createHash('sha256')
      .update(signatureString + this.clientSecret)
      .digest('hex');
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const paymentData = {
        notifyUrl: request.callbackUrl,
        customerIp: '127.0.0.1',
        merchantPosId: this.posId,
        description: `Payment for order ${request.orderId}`,
        currencyCode: request.currency,
        totalAmount: Math.round(request.amount * 100).toString(), // PayU uses grosze/cents
        buyer: {
          email: request.customer.email,
          firstName: request.customer.name?.split(' ')[0] || '',
          lastName: request.customer.name?.split(' ').slice(1).join(' ') || '',
          phone: request.customer.phone || '',
        },
        products: [
          {
            name: `Order ${request.orderId}`,
            unitPrice: Math.round(request.amount * 100).toString(),
            quantity: '1',
          },
        ],
        extOrderId: request.orderId,
      };

      const signature = this.generateSignature({
        ...paymentData,
        merchantPosId: this.posId,
      });

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/api/v2_1/orders`,
          {
            ...paymentData,
            signature,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${await this.getAccessToken()}`,
            },
          },
        ),
      );

      return {
        paymentId: response.data.orderId,
        redirectUrl: response.data.redirectUri,
        status: 'PENDING',
        providerTransactionId: response.data.orderId,
      };
    } catch (error) {
      this.logger.error(`PayU createPayment error: ${error}`, undefined, 'PayUService');
      throw error;
    }
  }

  private async getAccessToken(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/pl/standard/user/oauth/authorize`,
          new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.clientId,
            client_secret: this.clientSecret,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );
      return response.data.access_token;
    } catch (error) {
      this.logger.error(`PayU getAccessToken error: ${error}`, undefined, 'PayUService');
      throw error;
    }
  }

  async getPaymentStatus(providerTransactionId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/api/v2_1/orders/${providerTransactionId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );
      return response.data;
    } catch (error) {
      this.logger.error(`PayU getPaymentStatus error: ${error}`, undefined, 'PayUService');
      throw error;
    }
  }

  async refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    try {
      const paymentStatus = await this.getPaymentStatus(request.paymentId);
      const refundAmount = request.amount
        ? Math.round(request.amount * 100).toString()
        : paymentStatus.totalAmount;

      const refundData = {
        orderId: request.paymentId,
        refund: {
          amount: refundAmount,
          description: request.reason || 'Refund',
        },
      };

      const accessToken = await this.getAccessToken();
      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/api/v2_1/orders/${request.paymentId}/refund`, refundData, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }),
      );

      return {
        refundId: response.data.refundId || response.data.orderId,
        status: response.data.status,
        amount: parseFloat(refundAmount) / 100,
      };
    } catch (error) {
      this.logger.error(`PayU refundPayment error: ${error}`, undefined, 'PayUService');
      throw error;
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      // PayU webhook signature verification
      const calculatedSignature = this.generateSignature(payload);
      return calculatedSignature === signature;
    } catch (error) {
      this.logger.error(`PayU webhook verification error: ${error}`, undefined, 'PayUService');
      return false;
    }
  }
}

