import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { UserRole } from '@common/decorators/roles.decorator';

export type UserDocument = User & Document;

@Schema({ _id: true, timestamps: true })
export class Address {
  @Prop({ default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true, default: 'Home' })
  label: string;

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

  @Prop({ default: false })
  isDefault: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  })
  email: string;

  @Prop({ required: true, select: false })
  password?: string;

  @Prop({
    type: [String],
    enum: Object.values(UserRole),
    default: [UserRole.CUSTOMER],
    index: true,
  })
  roles: string[];

  @Prop({ type: [AddressSchema], default: [] })
  addresses: Address[];

  @Prop({ select: false, default: null })
  refreshTokenHash?: string | null;

  @Prop({ select: false, default: null })
  passwordResetToken?: string | null;

  @Prop({ select: false, default: null })
  passwordResetExpires?: Date | null;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ default: null })
  avatar?: string;

  @Prop({ default: null })
  phone?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Ensure index on email
UserSchema.index({ email: 1 });

