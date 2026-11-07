import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductImageDto {
  @ApiProperty({ example: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiPropertyOptional({ example: 'Front view in Noir Black' })
  @IsOptional()
  @IsString()
  altText?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class VariantSizeDto {
  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'LX-CSH-BLK-M' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 15, minimum: 0 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  priceAdjustment?: number;
}

export class ProductVariantDto {
  @ApiProperty({ example: 'Noir Black' })
  @IsString()
  @IsNotEmpty()
  colorName: string;

  @ApiProperty({ example: '#111111' })
  @IsString()
  @IsNotEmpty()
  colorHex: string;

  @ApiProperty({ example: 'BLK' })
  @IsString()
  @IsNotEmpty()
  colorCode: string;

  @ApiProperty({ type: [ProductImageDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images: ProductImageDto[];

  @ApiProperty({ type: [VariantSizeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantSizeDto)
  sizes: VariantSizeDto[];
}

export class CreateProductDto {
  @ApiProperty({ example: 'Vicuna & Cashmere Double-Breasted Overcoat' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'vicuna-cashmere-overcoat' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'LX-COAT-001' })
  @IsString()
  @IsNotEmpty()
  sku: string;

  @ApiProperty({ example: 'Luxe Atelier' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ example: 'Outerwear' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Meticulously handcrafted in Florence from rare unbleached vicuna...' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ example: ['90% Cashmere', '10% Vicuna'] })
  @IsOptional()
  @IsArray()
  materials?: string[];

  @ApiPropertyOptional({ example: 'Specialist dry clean only' })
  @IsOptional()
  @IsString()
  careInstructions?: string;

  @ApiProperty({ example: 18500, description: 'Price in BDT (৳)' })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({ example: 22000, description: 'Original MSRP in BDT (৳)' })
  @IsOptional()
  @IsNumber()
  comparePrice?: number;

  @ApiPropertyOptional({ example: ['outerwear', 'cashmere', 'winter', 'luxury'] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiProperty({ type: [ProductVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants: ProductVariantDto[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: { fit: 'Tailored Fit', season: 'Autumn/Winter' } })
  @IsOptional()
  attributes?: Record<string, string>;
}

export class UpdateProductDto extends CreateProductDto {}

export class FilterProductQueryDto {
  @ApiPropertyOptional({ example: 'cashmere' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Outerwear' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Luxe Atelier' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ example: 5000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ example: 'price-desc', enum: ['price-asc', 'price-desc', 'newest', 'rating'] })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 12, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 12;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  featured?: boolean;
}

