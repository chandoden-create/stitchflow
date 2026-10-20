import {
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConsentStatus } from '@prisma/client';

export class CreateCustomerDto {
  @ApiProperty({ example: 'Priya Sharma' })
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'WhatsApp number in E.164 format',
  })
  @IsString()
  whatsappNumber: string;

  @ApiPropertyOptional({ example: '+919876543211' })
  @IsOptional()
  @IsString()
  altPhone?: string;

  @ApiPropertyOptional({ example: 'Prefers cotton fabric' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({ enum: ConsentStatus, default: ConsentStatus.PENDING })
  @IsOptional()
  @IsEnum(ConsentStatus)
  consentStatus?: ConsentStatus;
}
