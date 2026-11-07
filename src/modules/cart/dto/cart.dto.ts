import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty({ example: '674f76239f829d10ab38c821', description: 'Product ObjectId' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'LX-CSH-BLK-M', description: 'Variant SKU' })
  @IsString()
  @IsNotEmpty()
  variantSku: string;

  @ApiProperty({ example: 'Noir Black' })
  @IsString()
  @IsNotEmpty()
  colorName: string;

  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  sizeLabel: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Guest session identifier if unauthenticated' })
  @IsOptional()
  @IsString()
  guestSessionId?: string;
}

export class UpdateCartItemDto {
  @ApiProperty({ example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Guest session identifier if unauthenticated' })
  @IsOptional()
  @IsString()
  guestSessionId?: string;
}

export class SyncCartItemDto {
  @ApiProperty({ example: '674f76239f829d10ab38c821' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'LX-CSH-BLK-M' })
  @IsString()
  @IsNotEmpty()
  variantSku: string;

  @ApiProperty({ example: 'Noir Black' })
  @IsString()
  colorName: string;

  @ApiProperty({ example: 'M' })
  @IsString()
  sizeLabel: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class SyncGuestCartDto {
  @ApiProperty({ type: [SyncCartItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncCartItemDto)
  items: SyncCartItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  guestSessionId?: string;
}

