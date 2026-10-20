import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentDesigner } from '../common/decorators/current-designer.decorator';

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Meta Webhook verification handshake
   */
  @Get('webhook')
  @ApiOperation({ summary: 'Meta WhatsApp webhook verification challenge' })
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string {
    const expectedToken =
      this.configService.get<string>('WHATSAPP_VERIFY_TOKEN') || 'stitchflow-webhook-verify';

    if (mode === 'subscribe' && token === expectedToken) {
      this.logger.log('WhatsApp webhook verified successfully');
      return challenge;
    }

    this.logger.warn('WhatsApp webhook verification failed');
    throw new ForbiddenException('Invalid verification token');
  }

  /**
   * Meta Webhook event receiver for delivery receipts
   */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Meta WhatsApp delivery status webhook callback' })
  async handleWebhook(@Body() payload: any): Promise<{ received: boolean }> {
    await this.whatsappService.handleWebhookPayload(payload);
    return { received: true };
  }

  /**
   * Manual retry for a failed message
   */
  @Post('messages/:id/retry')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Manually retry sending a failed WhatsApp message' })
  @ApiResponse({ status: 200, description: 'Message retry initiated' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async retryMessage(
    @CurrentDesigner('id') designerId: string,
    @Param('id') messageId: string,
  ) {
    return this.whatsappService.retryMessage(designerId, messageId);
  }

  /**
   * Get WhatsApp messages history for an order
   */
  @Get('messages/order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get WhatsApp notification history for an order' })
  async getOrderMessages(
    @CurrentDesigner('id') designerId: string,
    @Param('orderId') orderId: string,
  ) {
    return this.whatsappService.getMessagesForOrder(designerId, orderId);
  }
}
