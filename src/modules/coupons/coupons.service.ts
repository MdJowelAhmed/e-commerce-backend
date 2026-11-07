import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument, CouponDiscountType } from './schemas/coupon.schema';
import { CreateCouponDto, ValidateCouponDto } from './dto/coupons.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name) private readonly couponModel: Model<CouponDocument>,
  ) {}

  async create(dto: CreateCouponDto) {
    const existing = await this.couponModel.findOne({ code: dto.code.toUpperCase() });
    if (existing) {
      throw new ConflictException(`Coupon with code "${dto.code}" already exists`);
    }

    const coupon = new this.couponModel({
      ...dto,
      code: dto.code.toUpperCase(),
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });

    return coupon.save();
  }

  async validateCoupon(dto: ValidateCouponDto) {
    const coupon = await this.couponModel.findOne({
      code: dto.code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      throw new NotFoundException('Invalid or expired coupon code');
    }

    const now = new Date();
    if (now < coupon.startDate || now > coupon.endDate) {
      throw new BadRequestException('This coupon has expired or is not yet active');
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('This coupon has reached its maximum usage limit');
    }

    if (dto.subtotal < coupon.minimumOrderAmount) {
      throw new BadRequestException(
        `Order subtotal must be at least ৳${coupon.minimumOrderAmount} to apply this coupon`,
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === CouponDiscountType.PERCENTAGE) {
      discountAmount = (dto.subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountCap && discountAmount > coupon.maxDiscountCap) {
        discountAmount = coupon.maxDiscountCap;
      }
    } else {
      discountAmount = Math.min(coupon.discountValue, dto.subtotal);
    }

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      newSubtotal: Math.max(0, dto.subtotal - discountAmount),
    };
  }

  async findAll() {
    return this.couponModel.find().sort({ createdAt: -1 }).lean();
  }

  async delete(id: string) {
    const deleted = await this.couponModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException('Coupon not found');
    }
    return { success: true };
  }
}

