import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { SslCommerzAdapter } from './adapters/sslcommerz.adapter';
import { BkashAdapter } from './adapters/bkash.adapter';
import { NagadAdapter } from './adapters/nagad.adapter';
import { CodAdapter } from './adapters/cod.adapter';
import { Order, OrderSchema } from '@modules/orders/schemas/order.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    SslCommerzAdapter,
    BkashAdapter,
    NagadAdapter,
    CodAdapter,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}

