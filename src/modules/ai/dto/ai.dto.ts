import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChatMessageDto {
  @ApiProperty({ example: 'user', enum: ['user', 'model', 'system'] })
  @IsString()
  role: 'user' | 'model' | 'system';

  @ApiProperty({ example: 'I am attending a winter evening reception in Gulshan. What should I wear?' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class AiChatDto {
  @ApiProperty({ example: 'What cashmere coats do you have in stock for under ৳25,000?' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ type: [ChatMessageDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];
}

export class AiSearchQueryDto {
  @ApiProperty({
    example: 'Formal winter cocktail gala under 30000 BDT',
    description: 'Natural language search query expressing customer intent, budget, season, or style',
  })
  @IsString()
  @IsNotEmpty()
  query: string;
}

export class OutfitGeneratorQueryDto {
  @ApiPropertyOptional({
    example: '674f76239f829d10ab38c821',
    description: 'Optional anchor product ID to style around',
  })
  @IsOptional()
  @IsString()
  anchorProductId?: string;

  @ApiPropertyOptional({
    example: 'Black Tie Gala or Riviera Summer',
    description: 'Style aesthetic or occasion',
  })
  @IsOptional()
  @IsString()
  occasion?: string;
}

