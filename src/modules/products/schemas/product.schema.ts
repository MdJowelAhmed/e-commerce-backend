import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ _id: true })
export class ProductImage {
  @Prop({ default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  url: string;

  @Prop({ required: false, default: '' })
  altText: string;

  @Prop({ default: false })
  isPrimary: boolean;
}

export const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

@Schema({ _id: true })
export class VariantSize {
  @Prop({ default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true })
  label: string; // e.g. 'XS', 'S', 'M', 'L', 'XL', '40', '42'

  @Prop({ required: true, trim: true })
  sku: string; // e.g. 'LX-CSH-BLK-M'

  @Prop({ required: true, min: 0, default: 0 })
  stock: number;

  @Prop({ default: 0 })
  priceAdjustment: number; // Optional price delta for oversized/special sizes
}

export const VariantSizeSchema = SchemaFactory.createForClass(VariantSize);

@Schema({ _id: true })
export class ProductVariant {
  @Prop({ default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  colorName: string; // e.g. 'Noir Black', 'Camel Beige'

  @Prop({ required: true, trim: true })
  colorHex: string; // e.g. '#0F0F0F', '#C19A6B'

  @Prop({ required: true, trim: true })
  colorCode: string; // e.g. 'BLK', 'CML'

  @Prop({ type: [ProductImageSchema], default: [] })
  images: ProductImage[];

  @Prop({ type: [VariantSizeSchema], required: true, default: [] })
  sizes: VariantSize[];
}

export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

@Schema({ timestamps: true, collection: 'products' })
export class Product {
  @Prop({ required: true, trim: true, index: 'text' })
  title: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  slug: string;

  @Prop({ required: true, unique: true, uppercase: true, trim: true })
  sku: string;

  @Prop({ required: true, trim: true, index: true })
  brand: string;

  @Prop({ required: true, trim: true, index: true })
  category: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  materials: string[];

  @Prop({ default: '' })
  careInstructions: string;

  @Prop({ required: true, min: 0, index: true })
  basePrice: number;

  @Prop({ min: 0, default: null })
  comparePrice?: number;

  @Prop({ type: [String], index: true, default: [] })
  tags: string[];

  @Prop({ type: [ProductVariantSchema], required: true, default: [] })
  variants: ProductVariant[];

  @Prop({ default: 0, min: 0, index: true })
  totalStock: number;

  @Prop({ default: false, index: true })
  isFeatured: boolean;

  @Prop({ default: true, index: true })
  isActive: boolean;

  @Prop({ default: 5.0, min: 0, max: 5 })
  rating: number;

  @Prop({ default: 0, min: 0 })
  reviewCount: number;

  @Prop({ type: Object, default: {} })
  attributes?: Record<string, string>;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Compound & text indexes for enterprise search & filtering
ProductSchema.index({ brand: 1, category: 1, isActive: 1 });
ProductSchema.index({ basePrice: 1, isActive: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({
  title: 'text',
  description: 'text',
  brand: 'text',
  category: 'text',
  tags: 'text',
});

// Pre-save hook: auto-calculate aggregate totalStock across variants and sizes
ProductSchema.pre('save', function (next) {
  if (this.variants && Array.isArray(this.variants)) {
    let stockSum = 0;
    for (const variant of this.variants) {
      if (variant.sizes && Array.isArray(variant.sizes)) {
        for (const size of variant.sizes) {
          stockSum += size.stock || 0;
        }
      }
    }
    this.totalStock = stockSum;
  }
  next();
});

