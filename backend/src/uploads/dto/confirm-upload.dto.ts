import { IsString, IsInt, IsOptional, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmUploadDto {
  @ApiProperty({ description: 'Order Item ID that this photo belongs to' })
  @IsString()
  orderItemId: string;

  @ApiProperty({ description: 'Storage key returned during presign request' })
  @IsString()
  @MaxLength(500)
  storageKey: string;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  contentType: string;

  @ApiPropertyOptional({ example: 204800, description: 'File size in bytes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  sizeBytes?: number;
}
