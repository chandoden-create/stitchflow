import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentDesigner } from '../common/decorators/current-designer.decorator';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request presigned S3 upload URL for garment photo' })
  @ApiResponse({ status: 200, description: 'Presigned upload URL generated' })
  @ApiResponse({ status: 400, description: 'Invalid content type' })
  async presign(
    @CurrentDesigner('id') designerId: string,
    @Body() dto: PresignUploadDto,
  ) {
    return this.uploadsService.createPresignedUploadUrl(designerId, dto);
  }

  @Post('confirm')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Confirm photo upload and associate with order item' })
  @ApiResponse({ status: 201, description: 'Photo attached to order item' })
  @ApiResponse({ status: 404, description: 'Order item not found' })
  async confirm(
    @CurrentDesigner('id') designerId: string,
    @Body() dto: ConfirmUploadDto,
  ) {
    return this.uploadsService.confirmUpload(designerId, dto);
  }

  @Get(':photoId/url')
  @ApiOperation({ summary: 'Get secure time-limited presigned URL to view photo' })
  @ApiResponse({ status: 200, description: 'Presigned view URL' })
  @ApiResponse({ status: 404, description: 'Photo not found' })
  async getViewUrl(
    @CurrentDesigner('id') designerId: string,
    @Param('photoId') photoId: string,
  ) {
    return this.uploadsService.getPhotoViewUrl(designerId, photoId);
  }
}
