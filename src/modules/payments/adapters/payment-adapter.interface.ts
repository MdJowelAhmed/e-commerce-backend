import { PaymentMethod, PaymentStatus } from '@modules/orders/schemas/order.schema';

export interface PaymentInitiationResult {
  gateway: PaymentMethod;
  paymentUrl?: string;
  transactionId: string;
  redirectRequired: boolean;
  rawResponse?: Record<string, any>;
}

export interface PaymentVerificationResult {
  isSuccess: boolean;
  transactionId: string;
  orderNumber: string;
  amount: number;
  paymentStatus: PaymentStatus;
  rawPayload?: Record<string, any>;
}

export interface IPaymentAdapter {
  initiatePayment(order: any): Promise<PaymentInitiationResult>;
  verifyPayment(payload: any): Promise<PaymentVerificationResult>;
}

