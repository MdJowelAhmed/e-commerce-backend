import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument, PaymentMethod, PaymentStatus, OrderStatus } from '@modules/orders/schemas/order.schema';
import { SslCommerzAdapter } from './adapters/sslcommerz.adapter';
import { BkashAdapter } from './adapters/bkash.adapter';
import { NagadAdapter } from './adapters/nagad.adapter';
import { CodAdapter } from './adapters/cod.adapter';
import { IPaymentAdapter } from './adapters/payment-adapter.interface';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly adapters: Map<PaymentMethod, IPaymentAdapter>;

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly sslCommerzAdapter: SslCommerzAdapter,
    private readonly bkashAdapter: BkashAdapter,
    private readonly nagadAdapter: NagadAdapter,
    private readonly codAdapter: CodAdapter,
  ) {
    this.adapters = new Map<PaymentMethod, IPaymentAdapter>([
      [PaymentMethod.SSLCOMMERZ, this.sslCommerzAdapter],
      [PaymentMethod.BKASH, this.bkashAdapter],
      [PaymentMethod.NAGAD, this.nagadAdapter],
      [PaymentMethod.COD, this.codAdapter],
    ]);
  }

  async initiate(orderId: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    const adapter = this.adapters.get(order.paymentInfo.method);
    if (!adapter) {
      throw new BadRequestException(
        `No payment adapter configured for ${order.paymentInfo.method}`,
      );
    }

    const result = await adapter.initiatePayment(order);

    order.paymentInfo.transactionId = result.transactionId;
    order.paymentInfo.providerMetadata = result.rawResponse || {};
    await order.save();

    return result;
  }

  async handleWebhook(gateway: PaymentMethod, payload: any) {
    const adapter = this.adapters.get(gateway);
    if (!adapter) {
      throw new BadRequestException(`Unknown payment gateway: ${gateway}`);
    }

    const verification = await adapter.verifyPayment(payload);
    this.logger.log(`Webhook verification result for ${gateway}: ${JSON.stringify(verification)}`);

    if (verification.orderNumber) {
      const order = await this.orderModel.findOne({
        $or: [
          { orderNumber: verification.orderNumber },
          { 'paymentInfo.transactionId': verification.transactionId },
        ],
      });

      if (order) {
        order.paymentInfo.status = verification.paymentStatus;
        order.paymentInfo.transactionId = verification.transactionId;

        if (verification.paymentStatus === PaymentStatus.PAID) {
          order.paymentInfo.paidAt = new Date();
          order.orderStatus = OrderStatus.PROCESSING;
          order.timeline.push({
            status: OrderStatus.PROCESSING,
            note: `Payment confirmed via ${gateway} (Trx: ${verification.transactionId})`,
            timestamp: new Date(),
          });
        }

        await order.save();
      }
    }

    return verification;
  }
}

