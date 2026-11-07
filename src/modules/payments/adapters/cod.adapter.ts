import { Injectable } from '@nestjs/common';
import {
  IPaymentAdapter,
  PaymentInitiationResult,
  PaymentVerificationResult,
} from './payment-adapter.interface';
import { PaymentMethod, PaymentStatus } from '@modules/orders/schemas/order.schema';

@Injectable()
export class CodAdapter implements IPaymentAdapter {
  async initiatePayment(order: any): Promise<PaymentInitiationResult> {
    return {
      gateway: PaymentMethod.COD,
      transactionId: `COD_${order.orderNumber}`,
      redirectRequired: false,
    };
  }

  async verifyPayment(payload: any): Promise<PaymentVerificationResult> {
    return {
      isSuccess: true,
      transactionId: payload?.transactionId || `COD_${payload?.orderNumber}`,
      orderNumber: payload?.orderNumber,
      amount: payload?.amount || 0,
      paymentStatus: PaymentStatus.PAID,
    };
  }
}

