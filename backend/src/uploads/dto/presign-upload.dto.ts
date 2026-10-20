import { IsString, IsIn, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PresignUploadDto {
  @ApiProperty({
    example: 'image/jpeg',
    enum: ['image/jpeg', 'image/png', 'image/webp'],
    description: 'MIME type of the garment photo',
  })
  @IsString()
  @IsIn(['image/jpeg', 'image/png', 'image/webp'], {
    message: 'contentType must be one of: image/jpeg, image/png, image/webp',
  })
  contentType: string;

  @ApiPropertyOptional({ example: 'garment_blouse_back.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fileName?: string;

  @ApiPropertyOptional({ description: 'Optional Order Item ID to associate with photo' })
  @IsOptional()
  @IsString()
  orderItemId?: string;
}
