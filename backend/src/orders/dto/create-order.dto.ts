import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  IsNumberString,
  IsDateString,
  MinLength,
  MaxLength,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GarmentType } from '@prisma/client';

export class CreateOrderItemDto {
  @ApiProperty({ enum: GarmentType })
  @IsEnum(GarmentType)
  garmentType: GarmentType;

  @ApiProperty({ example: 'Silk blouse with designer back neck' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiProperty({ example: '800.00', description: 'Unit price as decimal string' })
  @IsNumberString()
  unitPrice: string;

  @ApiPropertyOptional({ example: 'Extra embroidery required' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'Customer ID (CUID)' })
  @IsString()
  customerId: string;

  @ApiProperty({ type: [CreateOrderItemDto], minItems: 1 })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiPropertyOptional({ example: '100.00', description: 'Discount amount' })
  @IsOptional()
  @IsNumberString()
  discount?: string;

  @ApiPropertyOptional({ example: '50.00', description: 'Additional charges (delivery, etc.)' })
  @IsOptional()
  @IsNumberString()
  additionalCharges?: string;

  @ApiPropertyOptional({ example: '500.00', description: 'Advance payment amount' })
  @IsOptional()
  @IsNumberString()
  advanceAmount?: string;

  @ApiPropertyOptional({ example: '2024-12-31T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
