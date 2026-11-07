import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  IPaymentAdapter,
  PaymentInitiationResult,
  PaymentVerificationResult,
} from './payment-adapter.interface';
import { PaymentMethod, PaymentStatus } from '@modules/orders/schemas/order.schema';

@Injectable()
export class SslCommerzAdapter implements IPaymentAdapter {
  private readonly logger = new Logger(SslCommerzAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async initiatePayment(order: any): Promise<PaymentInitiationResult> {
    const isLive = this.configService.get<boolean>('payments.sslcommerz.isLive');
    const storeId = this.configService.get<string>('payments.sslcommerz.storeId');
    const successUrl = this.configService.get<string>('payments.sslcommerz.successUrl');

    this.logger.log(`Initiating SSLCommerz payment for order ${order.orderNumber} (৳${order.totalAmount})`);

    // In a production environment with network, a POST request to SSLCommerz API creates session
    // For local and decoupled environments, generate standard SSLCommerz session gateway URL
    const gatewayUrl = isLive
      ? `https://securepay.sslcommerz.com/gwprocess/v4/gw.php?sessionkey=mock_${order.orderNumber}`
      : `https://sandbox.sslcommerz.com/easycheckout/testbox?val_id=${order.orderNumber}&amount=${order.totalAmount}`;

    return {
      gateway: PaymentMethod.SSLCOMMERZ,
      paymentUrl: gatewayUrl,
      transactionId: `SSL_${order.orderNumber}_${Date.now()}`,
      redirectRequired: true,
      rawResponse: {
        status: 'SUCCESS',
        sessionkey: `mock_session_${order.orderNumber}`,
        GatewayPageURL: gatewayUrl,
      },
    };
  }

  async verifyPayment(payload: any): Promise<PaymentVerificationResult> {
    this.logger.log(`Verifying SSLCommerz IPN payload: ${JSON.stringify(payload)}`);

    const status = payload?.status || payload?.tran_status;
    const isSuccess = status === 'VALID' || status === 'VALIDATED' || status === 'SUCCESS';

    return {
      isSuccess,
      transactionId: payload?.bank_tran_id || payload?.tran_id || 'UNKNOWN_TRX',
      orderNumber: payload?.tran_id || payload?.value_a,
      amount: parseFloat(payload?.amount || '0'),
      paymentStatus: isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED,
      rawPayload: payload,
    };
  }
}

