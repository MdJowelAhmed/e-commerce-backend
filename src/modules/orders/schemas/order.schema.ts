import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  COD = 'COD',
  SSLCOMMERZ = 'SSLCOMMERZ',
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
}

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true })
  size: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ required: false, default: '' })
  image: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class ShippingAddress {
  @Prop({ required: true })
  recipientName: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: false })
  postalCode?: string;

  @Prop({ required: true, default: 'Bangladesh' })
  country: string;

  @Prop({ required: true, default: true })
  isDhakaCity: boolean;
}

export const ShippingAddressSchema = SchemaFactory.createForClass(ShippingAddress);

@Schema({ _id: false })
export class PaymentInfo {
  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    required: true,
    default: PaymentMethod.COD,
  })
  method: PaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    required: true,
    default: PaymentStatus.UNPAID,
    index: true,
  })
  status: PaymentStatus;

  @Prop({ default: null })
  transactionId?: string;

  @Prop({ type: Object, default: {} })
  providerMetadata?: Record<string, any>;

  @Prop({ default: null })
  paidAt?: Date;
}

export const PaymentInfoSchema = SchemaFactory.createForClass(PaymentInfo);

@Schema({ _id: false })
export class OrderTimelineEvent {
  @Prop({ required: true })
  status: string;

  @Prop({ required: true })
  note: string;

  @Prop({ default: () => new Date() })
  timestamp: Date;
}

export const OrderTimelineEventSchema = SchemaFactory.createForClass(OrderTimelineEvent);

@Schema({ timestamps: true, collection: 'orders' })
export class Order {
  @Prop({ required: true, unique: true, index: true })
  orderNumber: string; // e.g. LX-20261106-9821

  @Prop({ type: Types.ObjectId, ref: 'User', index: true, default: null })
  user?: Types.ObjectId | null;

  @Prop({ lowercase: true, trim: true, default: null })
  guestEmail?: string | null;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ default: 0, min: 0 })
  discount: number;

  @Prop({ default: null })
  couponCode?: string | null;

  @Prop({ required: true, min: 0 })
  shippingFee: number;

  @Prop({ required: true, min: 0 })
  totalAmount: number;

  @Prop({ type: ShippingAddressSchema, required: true })
  shippingAddress: ShippingAddress;

  @Prop({ type: PaymentInfoSchema, required: true, default: () => ({}) })
  paymentInfo: PaymentInfo;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    index: true,
  })
  orderStatus: OrderStatus;

  @Prop({ default: null })
  courierTrackingNumber?: string;

  @Prop({ default: null })
  courierName?: string;

  @Prop({ type: [OrderTimelineEventSchema], default: [] })
  timeline: OrderTimelineEvent[];

  @Prop({ default: null })
  customerNotes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ orderStatus: 1, createdAt: -1 });
OrderSchema.index({ 'paymentInfo.status': 1 });
OrderSchema.index({ user: 1, createdAt: -1 });

