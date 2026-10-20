import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PresignUploadDto } from './dto/presign-upload.dto';
import { ConfirmUploadDto } from './dto/confirm-upload.dto';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly isMockStorage: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.bucketName = this.configService.get<string>('S3_BUCKET') || 'stitchflow-photos';
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.configService.get<string>('S3_SECRET_KEY');

    this.isMockStorage = !accessKeyId || accessKeyId === 'mock' || accessKeyId === 'minioadmin';

    this.s3Client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle: !!endpoint, // required for MinIO/LocalStack
      credentials:
        accessKeyId && secretAccessKey
          ? {
              accessKeyId,
              secretAccessKey,
            }
          : {
              accessKeyId: 'minioadmin',
              secretAccessKey: 'minioadmin',
            },
    });
  }

  /**
   * Generates a presigned S3 upload URL for garment photo upload.
   */
  async createPresignedUploadUrl(
    designerId: string,
    dto: PresignUploadDto,
  ): Promise<{ uploadUrl: string; storageKey: string }> {
    const ext = dto.contentType === 'image/png' ? 'png' : dto.contentType === 'image/webp' ? 'webp' : 'jpg';
    const storageKey = `designers/${designerId}/garments/${Date.now()}-${uuidv4()}.${ext}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: storageKey,
        ContentType: dto.contentType,
      });

      // Expires in 15 minutes
      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 900 });

      return {
        uploadUrl,
        storageKey,
      };
    } catch (error) {
      this.logger.error(`Failed to generate presigned upload URL: ${error.message}`);
      // Fallback for local mock development if S3 is unreachable
      const mockUrl = `/api/uploads/mock-upload?key=${encodeURIComponent(storageKey)}`;
      return {
        uploadUrl: mockUrl,
        storageKey,
      };
    }
  }

  /**
   * Confirms upload and links garment photo record to order item.
   */
  async confirmUpload(designerId: string, dto: ConfirmUploadDto): Promise<any> {
    // Verify order item belongs to an order owned by this designer
    const orderItem = await this.prisma.orderItem.findFirst({
      where: {
        id: dto.orderItemId,
        order: {
          designerId,
        },
      },
    });

    if (!orderItem) {
      throw new NotFoundException(
        'Order item not found or does not belong to an order owned by this designer',
      );
    }

    const photo = await this.prisma.garmentPhoto.create({
      data: {
        orderItemId: dto.orderItemId,
        storageKey: dto.storageKey,
        contentType: dto.contentType,
        sizeBytes: dto.sizeBytes || null,
      },
    });

    return photo;
  }

  /**
   * Generates a time-limited presigned GET URL for viewing a garment photo.
   */
  async getPhotoViewUrl(
    designerId: string,
    photoId: string,
  ): Promise<{ url: string; storageKey: string }> {
    const photo = await this.prisma.garmentPhoto.findFirst({
      where: {
        id: photoId,
        orderItem: {
          order: {
            designerId,
          },
        },
      },
    });

    if (!photo) {
      throw new NotFoundException('Garment photo not found');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: photo.storageKey,
      });

      // Presigned GET URL valid for 1 hour (3600 seconds)
      const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
      return { url, storageKey: photo.storageKey };
    } catch (error) {
      this.logger.error(`Failed to generate presigned GET URL: ${error.message}`);
      return {
        url: `https://${this.bucketName}.s3.amazonaws.com/${photo.storageKey}`,
        storageKey: photo.storageKey,
      };
    }
  }
}
