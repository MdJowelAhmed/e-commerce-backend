import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentStatus,
  PaymentMethod,
} from './schemas/order.schema';
import { Product, ProductDocument } from '@modules/products/schemas/product.schema';
import { Coupon, CouponDocument, CouponDiscountType } from '@modules/coupons/schemas/coupon.schema';
import { TransactionHelper } from '@database/transaction.helper';
import {
  CheckoutDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
} from './dto/orders.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(Coupon.name) private readonly couponModel: Model<CouponDocument>,
    private readonly transactionHelper: TransactionHelper,
  ) {}

  /**
   * Calculate shipping fee based on platform business rules:
   * - Free if subtotal >= ৳5,000
   * - ৳80 inside Dhaka City
   * - ৳150 nationwide outside Dhaka
   */
  calculateShippingFee(subtotal: number, isDhakaCity: boolean): number {
    if (subtotal >= 5000) {
      return 0;
    }
    return isDhakaCity ? 80 : 150;
  }

  /**
   * Place order and deduct stock atomically using MongoDB Transactions
   */
  async checkout(dto: CheckoutDto, userId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    return this.transactionHelper.withTransaction(async (session: ClientSession | null) => {
      const sessionOptions = session ? { session } : {};
      const processedItems: any[] = [];
      let subtotal = 0;

      // 1. Stock verification & atomic deduction for all line items
      for (const itemDto of dto.items) {
        const product = await this.productModel.findById(
          itemDto.productId,
          null,
          sessionOptions,
        );

        if (!product || !product.isActive) {
          throw new NotFoundException(
            `Product not found or currently unavailable: ${itemDto.productId}`,
          );
        }

        let matchedVariant: any = null;
        let matchedSize: any = null;

        for (const variant of product.variants) {
          for (const size of variant.sizes) {
            if (size.sku === itemDto.sku) {
              matchedVariant = variant;
              matchedSize = size;
              break;
            }
          }
          if (matchedSize) break;
        }

        if (!matchedSize) {
          throw new NotFoundException(
            `Variant SKU "${itemDto.sku}" does not exist on product "${product.title}"`,
          );
        }

        if (matchedSize.stock < itemDto.quantity) {
          throw new BadRequestException(
            `Stock unavailable for "${product.title}" (${matchedSize.label}). Only ${matchedSize.stock} left in stock.`,
          );
        }

        // Deduct variant stock atomically
        matchedSize.stock -= itemDto.quantity;
        await product.save(sessionOptions);

        const unitPrice = product.basePrice + (matchedSize.priceAdjustment || 0);
        const lineSubtotal = unitPrice * itemDto.quantity;
        subtotal += lineSubtotal;

        const primaryImage =
          matchedVariant.images?.find((img: any) => img.isPrimary)?.url ||
          matchedVariant.images?.[0]?.url ||
          '';

        processedItems.push({
          product: product._id,
          title: product.title,
          sku: matchedSize.sku,
          color: matchedVariant.colorName,
          size: matchedSize.label,
          price: unitPrice,
          quantity: itemDto.quantity,
          subtotal: lineSubtotal,
          image: primaryImage,
        });
      }

      // 2. Validate and apply coupon discount if provided
      let discount = 0;
      let appliedCouponCode: string | null = null;

      if (dto.couponCode) {
        const coupon = await this.couponModel.findOne(
          {
            code: dto.couponCode.toUpperCase(),
            isActive: true,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
          },
          null,
          sessionOptions,
        );

        if (coupon) {
          if (subtotal >= coupon.minimumOrderAmount) {
            if (coupon.discountType === CouponDiscountType.PERCENTAGE) {
              discount = (subtotal * coupon.discountValue) / 100;
              if (coupon.maxDiscountCap && discount > coupon.maxDiscountCap) {
                discount = coupon.maxDiscountCap;
              }
            } else {
              discount = Math.min(coupon.discountValue, subtotal);
            }

            coupon.usedCount += 1;
            await coupon.save(sessionOptions);
            appliedCouponCode = coupon.code;
          }
        }
      }

      // 3. Compute shipping fee and total amount
      const shippingFee = this.calculateShippingFee(
        subtotal,
        dto.shippingAddress.isDhakaCity,
      );
      const totalAmount = Math.max(0, subtotal - discount + shippingFee);

      // 4. Generate unique luxury order number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderNumber = `LX-${dateStr}-${randomSuffix}`;

      // 5. Create order document
      const order = new this.orderModel({
        orderNumber,
        user: userId ? new Types.ObjectId(userId) : null,
        guestEmail: userId ? null : dto.guestEmail || null,
        items: processedItems,
        subtotal,
        discount,
        couponCode: appliedCouponCode,
        shippingFee,
        totalAmount,
        shippingAddress: dto.shippingAddress,
        paymentInfo: {
          method: dto.paymentMethod,
          status:
            dto.paymentMethod === PaymentMethod.COD
              ? PaymentStatus.UNPAID
              : PaymentStatus.UNPAID,
        },
        orderStatus: OrderStatus.PENDING,
        timeline: [
          {
            status: OrderStatus.PENDING,
            note: 'Order placed by customer and awaits confirmation.',
            timestamp: new Date(),
          },
        ],
        customerNotes: dto.customerNotes || null,
      });

      await order.save(sessionOptions);

      this.logger.log(`Order ${orderNumber} successfully created. Total: ৳${totalAmount}`);
      return order;
    });
  }

  async findUserOrders(userId: string) {
    return this.orderModel
      .find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .lean();
  }

  async findByOrderNumber(orderNumber: string) {
    const order = await this.orderModel.findOne({ orderNumber }).lean();
    if (!order) {
      throw new NotFoundException(`Order ${orderNumber} not found`);
    }
    return order;
  }

  async findById(orderId: string) {
    const order = await this.orderModel.findById(orderId).lean();
    if (!order) {
      throw new NotFoundException(`Order not found`);
    }
    return order;
  }

  async findAll(page = 1, limit = 20, status?: OrderStatus) {
    const filter: Record<string, any> = {};
    if (status) {
      filter.orderStatus = status;
    }

    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.orderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order not found`);
    }

    order.orderStatus = dto.status;
    if (dto.trackingNumber) order.courierTrackingNumber = dto.trackingNumber;
    if (dto.courierName) order.courierName = dto.courierName;

    order.timeline.push({
      status: dto.status,
      note: dto.note || `Order status updated to ${dto.status}`,
      timestamp: new Date(),
    });

    await order.save();
    return order;
  }

  async updatePaymentStatus(orderId: string, dto: UpdatePaymentStatusDto) {
    const order = await this.orderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException(`Order not found`);
    }

    order.paymentInfo.status = dto.status;
    if (dto.transactionId) {
      order.paymentInfo.transactionId = dto.transactionId;
    }
    if (dto.status === PaymentStatus.PAID) {
      order.paymentInfo.paidAt = new Date();
    }

    await order.save();
    return order;
  }
}

