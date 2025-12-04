/**
 * ComGate Payment Service
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
export class ComGateService implements PaymentProvider {
  private readonly merchantId: string;
  private readonly secretKey: string;
  private readonly testMode: boolean;
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logger: LoggerService,
  ) {
    this.merchantId = this.configService.get<string>('COMGATE_MERCHANT_ID') || '';
    this.secretKey = this.configService.get<string>('COMGATE_SECRET_KEY') || '';
    this.testMode = this.configService.get<string>('COMGATE_TEST_MODE') === 'true';
    this.baseUrl = this.configService.get<string>('COMGATE_API_URL') || 'https://payments.comgate.cz/v1.0';
  }

  private generateHash(params: Record<string, any>): string {
    // ComGate hash generation
    const sortedKeys = Object.keys(params)
      .filter((key) => key !== 'hash' && params[key] !== null && params[key] !== undefined)
      .sort();
    const hashString = sortedKeys.map((key) => `${key}=${params[key]}`).join('&');
    return crypto.createHash('md5').update(hashString + this.secretKey).digest('hex');
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      const paymentData = {
        merchant: this.merchantId,
        test: this.testMode ? 'true' : 'false',
        price: Math.round(request.amount * 100).toString(), // Convert to cents
        curr: request.currency,
        label: `Payment for order ${request.orderId}`,
        refId: request.orderId,
        method: 'ALL', // Allow all payment methods
        email: request.customer.email,
        name: request.customer.name || '',
        prepareOnly: 'true',
        callback: request.callbackUrl,
      };

      const hash = this.generateHash(paymentData);
      paymentData['hash'] = hash;

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/create`, new URLSearchParams(paymentData), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      // Parse ComGate response (typically in format: code=0&message=OK&transId=...)
      const responseData = this.parseComGateResponse(response.data);

      if (responseData.code !== '0') {
        throw new Error(`ComGate error: ${responseData.message}`);
      }

      const redirectBaseUrl = this.configService.get<string>('COMGATE_REDIRECT_BASE_URL') || this.baseUrl;
      return {
        paymentId: responseData.transId,
        redirectUrl: `${redirectBaseUrl}/redirect?transId=${responseData.transId}`,
        status: 'PENDING',
        providerTransactionId: responseData.transId,
      };
    } catch (error) {
      this.logger.error(`ComGate createPayment error: ${error}`, undefined, 'ComGateService');
      throw error;
    }
  }

  private parseComGateResponse(data: string): Record<string, string> {
    const result: Record<string, string> = {};
    const pairs = data.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      result[key] = decodeURIComponent(value || '');
    }
    return result;
  }

  async getPaymentStatus(providerTransactionId: string): Promise<any> {
    try {
      const statusData = {
        merchant: this.merchantId,
        transId: providerTransactionId,
      };

      const hash = this.generateHash(statusData);
      statusData['hash'] = hash;

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/status`, new URLSearchParams(statusData), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      return this.parseComGateResponse(response.data);
    } catch (error) {
      this.logger.error(`ComGate getPaymentStatus error: ${error}`, undefined, 'ComGateService');
      throw error;
    }
  }

  async refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    try {
      const refundData = {
        merchant: this.merchantId,
        transId: request.paymentId,
        amount: request.amount ? Math.round(request.amount * 100).toString() : undefined,
      };

      const hash = this.generateHash(refundData);
      refundData['hash'] = hash;

      const response = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/refund`, new URLSearchParams(refundData), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      const responseData = this.parseComGateResponse(response.data);

      if (responseData.code !== '0') {
        throw new Error(`ComGate refund error: ${responseData.message}`);
      }

      return {
        refundId: responseData.transId || request.paymentId,
        status: 'PROCESSING',
        amount: request.amount || 0,
      };
    } catch (error) {
      this.logger.error(`ComGate refundPayment error: ${error}`, undefined, 'ComGateService');
      throw error;
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      // ComGate webhook signature verification
      const calculatedHash = this.generateHash(payload);
      return calculatedHash === signature;
    } catch (error) {
      this.logger.error(`ComGate webhook verification error: ${error}`, undefined, 'ComGateService');
      return false;
    }
  }
}

