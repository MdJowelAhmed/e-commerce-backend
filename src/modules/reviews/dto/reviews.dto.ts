import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ example: '674f76239f829d10ab38c821' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiProperty({ example: 'Exceptional craftsmanship and bespoke feel' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'The Mongolian cashmere fabric is remarkably soft and drapes flawlessly. Worth every taka.',
  })
  @IsString()
  @IsNotEmpty()
  comment: string;

  @ApiPropertyOptional({ example: ['https://images.unsplash.com/review-photo-1.jpg'] })
  @IsOptional()
  @IsArray()
  photos?: string[];
}

