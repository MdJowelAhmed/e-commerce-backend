import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentAdapter,
  PaymentInitiationResult,
  PaymentVerificationResult,
} from './payment-adapter.interface';
import { PaymentMethod, PaymentStatus } from '@modules/orders/schemas/order.schema';

@Injectable()
export class BkashAdapter implements IPaymentAdapter {
  private readonly logger = new Logger(BkashAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async initiatePayment(order: any): Promise<PaymentInitiationResult> {
    this.logger.log(`Initiating bKash payment checkout for order ${order.orderNumber}`);

    const paymentUrl = `https://checkout.sandbox.bka.sh/v1.2.0-beta/checkout?paymentID=BK_${order.orderNumber}`;

    return {
      gateway: PaymentMethod.BKASH,
      paymentUrl,
      transactionId: `BK_${order.orderNumber}`,
      redirectRequired: true,
      rawResponse: {
        paymentID: `BK_${order.orderNumber}`,
        bkashURL: paymentUrl,
        statusCode: '0000',
      },
    };
  }

  async verifyPayment(payload: any): Promise<PaymentVerificationResult> {
    const isSuccess = payload?.statusCode === '0000' || payload?.transactionStatus === 'Completed';

    return {
      isSuccess,
      transactionId: payload?.trxID || payload?.paymentID || 'UNKNOWN_BKASH_TRX',
      orderNumber: payload?.merchantInvoiceNumber || payload?.orderNumber,
      amount: parseFloat(payload?.amount || '0'),
      paymentStatus: isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED,
      rawPayload: payload,
    };
  }
}

