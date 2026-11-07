import {
  Controller,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Public } from '@common/decorators/public.decorator';
import { PaymentMethod } from '@modules/orders/schemas/order.schema';
import { ResponseMessage } from '@common/decorators/response-message.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initiate/:orderId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate payment session with configured payment gateway' })
  @ResponseMessage('Payment session initiated')
  async initiate(@Param('orderId') orderId: string) {
    return this.paymentsService.initiate(orderId);
  }

  @Public()
  @Post('webhook/sslcommerz')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'SSLCommerz IPN (Instant Payment Notification) Webhook' })
  async sslcommerzWebhook(@Body() payload: any) {
    return this.paymentsService.handleWebhook(PaymentMethod.SSLCOMMERZ, payload);
  }

  @Public()
  @Post('webhook/bkash')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'bKash IPN / Callback Webhook' })
  async bkashWebhook(@Body() payload: any) {
    return this.paymentsService.handleWebhook(PaymentMethod.BKASH, payload);
  }

  @Public()
  @Post('webhook/nagad')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Nagad IPN / Callback Webhook' })
  async nagadWebhook(@Body() payload: any) {
    return this.paymentsService.handleWebhook(PaymentMethod.NAGAD, payload);
  }
}

