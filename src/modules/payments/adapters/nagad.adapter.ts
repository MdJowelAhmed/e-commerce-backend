import { Injectable, Logger } from '@nestjs/common';
import {
  IPaymentAdapter,
  PaymentInitiationResult,
  PaymentVerificationResult,
} from './payment-adapter.interface';
import { PaymentMethod, PaymentStatus } from '@modules/orders/schemas/order.schema';

@Injectable()
export class NagadAdapter implements IPaymentAdapter {
  private readonly logger = new Logger(NagadAdapter.name);

  async initiatePayment(order: any): Promise<PaymentInitiationResult> {
    this.logger.log(`Initiating Nagad payment for order ${order.orderNumber}`);

    const paymentUrl = `http://sandbox.nagad.com.bd/check-out/${order.orderNumber}`;

    return {
      gateway: PaymentMethod.NAGAD,
      paymentUrl,
      transactionId: `NGD_${order.orderNumber}`,
      redirectRequired: true,
      rawResponse: {
        status: 'Success',
        callBackUrl: paymentUrl,
      },
    };
  }

  async verifyPayment(payload: any): Promise<PaymentVerificationResult> {
    const isSuccess = payload?.status === 'Success';

    return {
      isSuccess,
      transactionId: payload?.issuer_payment_ref || payload?.order_id,
      orderNumber: payload?.order_id,
      amount: parseFloat(payload?.amount || '0'),
      paymentStatus: isSuccess ? PaymentStatus.PAID : PaymentStatus.FAILED,
      rawPayload: payload,
    };
  }
}

