import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Sanzid Rahman' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '+8801700000000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class AddAddressDto {
  @ApiProperty({ example: 'Penthouse Residence' })
  @IsString()
  @IsNotEmpty()
  label: string;

  @ApiProperty({ example: 'Sanzid Rahman' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: '+8801700000000' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'Road 11, House 42, Banani' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: '1213' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ example: 'Bangladesh', default: 'Bangladesh' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ example: true, description: 'True if inside Dhaka city' })
  @IsBoolean()
  isDhakaCity: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto extends AddAddressDto {}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword#2026' })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ example: 'NewSecretPass#2026' })
  @IsString()
  @MinLength(8)
  newPassword: string;
}

