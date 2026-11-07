import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  Min,
  IsDateString,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { CouponDiscountType } from '../schemas/coupon.schema';

export class CreateCouponDto {
  @ApiProperty({ example: 'LUXE15' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: CouponDiscountType, example: CouponDiscountType.PERCENTAGE })
  @IsEnum(CouponDiscountType)
  discountType: CouponDiscountType;

  @ApiProperty({ example: 15, description: 'Percentage (e.g. 15 for 15%) or flat amount in BDT' })
  @IsNumber()
  @Min(1)
  discountValue: number;

  @ApiPropertyOptional({ example: 5000, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumOrderAmount?: number;

  @ApiPropertyOptional({ example: 3000, description: 'Max discount amount cap' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountCap?: number;

  @ApiProperty({ example: '2026-01-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-12-31T23:59:59Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ValidateCouponDto {
  @ApiProperty({ example: 'LUXE15' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 12000, description: 'Current cart subtotal' })
  @IsNumber()
  @Min(0)
  subtotal: number;
}

