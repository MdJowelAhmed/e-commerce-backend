import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CouponDocument = Coupon & Document;

export enum CouponDiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

@Schema({ timestamps: true, collection: 'coupons' })
export class Coupon {
  @Prop({ required: true, unique: true, uppercase: true, trim: true, index: true })
  code: string;

  @Prop({
    type: String,
    enum: Object.values(CouponDiscountType),
    required: true,
    default: CouponDiscountType.PERCENTAGE,
  })
  discountType: CouponDiscountType;

  @Prop({ required: true, min: 0 })
  discountValue: number; // e.g. 15 for 15%, or 1000 for ৳1000 off

  @Prop({ default: 0, min: 0 })
  minimumOrderAmount: number; // Minimum subtotal required

  @Prop({ default: null, min: 0 })
  maxDiscountCap?: number; // Capped discount amount for percentage coupons

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ default: null, min: 0 })
  usageLimit?: number;

  @Prop({ default: 0, min: 0 })
  usedCount: number;

  @Prop({ default: true, index: true })
  isActive: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);

