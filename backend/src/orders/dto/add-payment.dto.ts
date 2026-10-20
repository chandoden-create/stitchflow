import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '@prisma/client';

export class AddPaymentDto {
  @ApiProperty({ example: '500.00', description: 'Payment amount as decimal string' })
  @IsNumberString()
  amount: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 'UPI-REF-12345' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  transactionRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'When payment was received (defaults to now)' })
  @IsOptional()
  @IsDateString()
  receivedAt?: string;
}
