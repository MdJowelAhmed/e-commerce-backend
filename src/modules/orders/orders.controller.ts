import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CheckoutDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
} from './dto/orders.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { Roles, UserRole } from '@common/decorators/roles.decorator';
import { RolesGuard } from '@common/guards/roles.guard';
import { ResponseMessage } from '@common/decorators/response-message.decorator';
import { OrderStatus } from './schemas/order.schema';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Post('checkout')
  @ApiOperation({ summary: 'Checkout and place a luxury order with ACID stock deduction' })
  @ResponseMessage('Order placed successfully')
  async checkout(
    @Body() dto: CheckoutDto,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.ordersService.checkout(dto, userId);
  }

  @Get('my')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged-in customer orders' })
  @ResponseMessage('Customer orders retrieved successfully')
  async getMyOrders(@CurrentUser('userId') userId: string) {
    return this.ordersService.findUserOrders(userId);
  }

  @Public()
  @Get('tracking/:orderNumber')
  @ApiOperation({ summary: 'Track an order publicly by order number' })
  @ResponseMessage('Order tracking retrieved')
  async trackOrder(@Param('orderNumber') orderNumber: string) {
    return this.ordersService.findByOrderNumber(orderNumber);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order details by order ID' })
  @ResponseMessage('Order retrieved successfully')
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'List all orders (Admin / Manager only)' })
  @ResponseMessage('Orders list retrieved successfully')
  async findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: OrderStatus,
  ) {
    return this.ordersService.findAll(
      parseInt(page, 10),
      parseInt(limit, 10),
      status,
    );
  }

  @Patch(':id/status')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update order lifecycle status (Admin / Manager only)' })
  @ResponseMessage('Order status updated successfully')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto);
  }

  @Patch(':id/payment')
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update order payment status (Admin only)' })
  @ResponseMessage('Payment status updated successfully')
  async updatePayment(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.ordersService.updatePaymentStatus(id, dto);
  }
}

