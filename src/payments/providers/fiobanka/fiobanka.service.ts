/**
 * Fio Banka Payment Service
 */

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from '../../../../shared/logger/logger.service';
import {
  PaymentProvider,
  CreatePaymentRequest,
  CreatePaymentResponse,
  RefundPaymentRequest,
  RefundPaymentResponse,
} from '../payment-provider.interface';

@Injectable()
export class FioBankaService implements PaymentProvider {
  private readonly apiKey: string;
  private readonly accountNumber: string;
  private readonly baseUrl: string;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private logger: LoggerService,
  ) {
    this.apiKey = this.configService.get<string>('FIO_BANKA_API_KEY') || '';
    this.accountNumber = this.configService.get<string>('FIO_BANKA_ACCOUNT_NUMBER') || '';
    this.baseUrl = this.configService.get<string>('FIO_BANKA_API_URL') || 'https://www.fio.cz/ib_api/rest';
  }

  async createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      // Fio Banka uses QR code generation for payments
      // Generate payment request with QR code
      const paymentData = {
        accountFrom: this.accountNumber,
        currency: request.currency,
        amount: request.amount,
        accountTo: this.accountNumber, // This would be the merchant account
        message: `Payment for order ${request.orderId}`,
        variableSymbol: request.orderId,
      };

      // Generate QR code payment request
      const qrCodeData = this.generateQRCode(paymentData);

      // In a real implementation, you would:
      // 1. Create a payment request in Fio Banka system
      // 2. Generate QR code for customer to scan
      // 3. Poll for payment confirmation

      return {
        paymentId: `FIO-${Date.now()}`,
        redirectUrl: qrCodeData.qrCodeUrl,
        status: 'PENDING',
        providerTransactionId: `FIO-${Date.now()}`,
      };
    } catch (error) {
      this.logger.error(`Fio Banka createPayment error: ${error}`, undefined, 'FioBankaService');
      throw error;
    }
  }

  private generateQRCode(paymentData: any): { qrCodeUrl: string; qrCodeData: string } {
    // Generate SPAYD format QR code for Czech banks
    const spayd = `SPD*1.0*ACC:${paymentData.accountTo}*AM:${paymentData.amount}*CC:${paymentData.currency}*MSG:${paymentData.message}*VS:${paymentData.variableSymbol}`;

    // In production, use a QR code generation library
    const qrCodeApiUrl = this.configService.get<string>('QR_CODE_API_URL') || 'https://api.qrserver.com/v1/create-qr-code';
    const qrCodeUrl = `${qrCodeApiUrl}/?size=300x300&data=${encodeURIComponent(spayd)}`;

    return {
      qrCodeUrl,
      qrCodeData: spayd,
    };
  }

  async getPaymentStatus(providerTransactionId: string): Promise<any> {
    try {
      // Fio Banka API call to check payment status
      // This would check the account statement for the payment
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/periods/${this.apiKey}/2024-01-01/2024-12-31/transactions.json`, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      // Find transaction by variable symbol
      const transaction = response.data.accountStatement.transactionList.transaction?.find(
        (t: any) => t.variableSymbol === providerTransactionId,
      );

      return transaction || { status: 'PENDING' };
    } catch (error) {
      this.logger.error(`Fio Banka getPaymentStatus error: ${error}`, undefined, 'FioBankaService');
      throw error;
    }
  }

  async refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResponse> {
    try {
      // Fio Banka refunds are typically manual bank transfers
      // This would initiate a bank transfer back to the customer
      const paymentStatus = await this.getPaymentStatus(request.paymentId);

      // Create refund transaction
      return {
        refundId: `FIO-REFUND-${Date.now()}`,
        status: 'PROCESSING',
        amount: request.amount || paymentStatus.amount,
      };
    } catch (error) {
      this.logger.error(`Fio Banka refundPayment error: ${error}`, undefined, 'FioBankaService');
      throw error;
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      // Fio Banka webhook verification
      // In production, verify signature from Fio Banka
      return !!signature;
    } catch (error) {
      this.logger.error(`Fio Banka webhook verification error: ${error}`, undefined, 'FioBankaService');
      return false;
    }
  }
}

