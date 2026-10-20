import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  WaMessageType,
  WaMessageStatus,
  ConsentStatus,
  WhatsAppMessage,
} from '@prisma/client';
import axios from 'axios';
import { normalizePhoneNumber } from '../common/utils/phone.util';

export const WHATSAPP_QUEUE = 'whatsapp_queue';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Queue order received notification
   */
  async queueOrderReceivedNotification(designerId: string, orderId: string): Promise<WhatsAppMessage> {
    return this.createAndDispatchMessage(designerId, orderId, WaMessageType.ORDER_RECEIVED);
  }

  /**
   * Queue order completed (ready for pickup) notification
   */
  async queueOrderCompletedNotification(designerId: string, orderId: string): Promise<WhatsAppMessage> {
    return this.createAndDispatchMessage(designerId, orderId, WaMessageType.ORDER_COMPLETED);
  }

  /**
   * Queue order delivered notification
   */
  async queueOrderDeliveredNotification(designerId: string, orderId: string): Promise<WhatsAppMessage> {
    return this.createAndDispatchMessage(designerId, orderId, WaMessageType.ORDER_DELIVERED);
  }

  /**
   * Core method to build payload, create WhatsAppMessage record, and send (live or mock).
   */
  async createAndDispatchMessage(
    designerId: string,
    orderId: string,
    messageType: WaMessageType,
  ): Promise<WhatsAppMessage> {
    // 1. Fetch order, designer, customer
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        designer: true,
        items: true,
        payments: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const { customer, designer } = order;

    // 2. Check consent status (warn if revoked)
    if (customer.consentStatus === ConsentStatus.REVOKED) {
      this.logger.warn(`Customer ${customer.id} has revoked WhatsApp messaging consent. Message skipped.`);
      throw new BadRequestException('Customer has revoked messaging consent');
    }

    // 3. Format message text dynamically
    const businessName = designer.businessName || 'Bhagyashri Tailoring';
    const currency = designer.currencySymbol || '₹';
    const signature = designer.messageSignature || businessName;
    const recipientPhone = normalizePhoneNumber(customer.whatsappNumber);

    let messageBody = '';
    const itemsSummary = order.items
      .map(
        (it, idx) =>
          `${idx + 1}. ${it.description} (×${it.quantity}) — ${currency}${it.lineTotal.toString()}`,
      )
      .join('\n');

    const totalPaid = order.payments
      .reduce((sum, p) => sum + Number(p.amount), 0)
      .toFixed(2);

    if (messageType === WaMessageType.ORDER_RECEIVED) {
      messageBody = `Hello ${customer.name}! 👋\n\nThank you for choosing ${businessName}.\n\nYour order has been registered successfully.\n\nOrder No: ${order.orderNumber}\n\nItems received:\n${itemsSummary}\n\nTotal order amount: ${currency}${order.finalTotal.toString()}\nAdvance received: ${currency}${order.advanceAmount.toString()}\nBalance due: ${currency}${order.balanceDue.toString()}\n\nWe will notify you when your order is ready.\n\nThank you for trusting our work! ❤️\n\n— ${signature}`;
    } else if (messageType === WaMessageType.ORDER_COMPLETED) {
      messageBody = `Hello ${customer.name}! ✨\n\nGood news! Your tailoring order ${order.orderNumber} has been completed and is ready for pickup.\n\nPlease visit ${businessName} to collect your garments.\n\nOrder total: ${currency}${order.finalTotal.toString()}\nAdvance received: ${currency}${order.advanceAmount.toString()}\nBalance due: ${currency}${order.balanceDue.toString()}\n\nThank you for choosing us! ❤️\n\n— ${signature}`;
    } else if (messageType === WaMessageType.ORDER_DELIVERED) {
      messageBody = `Hello ${customer.name}! 💖\n\nYour order ${order.orderNumber} has been delivered successfully.\n\nThank you for choosing ${businessName}. We hope you love our work!\n\nFinal order amount: ${currency}${order.finalTotal.toString()}\nAmount paid: ${currency}${totalPaid}\nBalance due: ${currency}${order.balanceDue.toString()}${
        Number(order.balanceDue) > 0
          ? '\n\nPlease ignore the outstanding balance if you have already paid it.'
          : ''
      }\n\nWe look forward to serving you again. If you liked our work, we would really appreciate your recommendation to friends and family.\n\nHave a wonderful day! ✨\n\n— ${signature}`;
    }

    const templatePayload = {
      recipient: recipientPhone,
      messageType,
      body: messageBody,
      orderNumber: order.orderNumber,
      orderId: order.id,
      timestamp: new Date().toISOString(),
    };

    // 4. Create database record
    const messageRecord = await this.prisma.whatsAppMessage.create({
      data: {
        designerId,
        customerId: customer.id,
        orderId: order.id,
        messageType,
        status: WaMessageStatus.QUEUED,
        templatePayload,
      },
    });

    // 5. Dispatch message (Live API or Mock Sandbox)
    await this.processMessage(messageRecord.id);

    return this.prisma.whatsAppMessage.findUnique({
      where: { id: messageRecord.id },
    }) as Promise<WhatsAppMessage>;
  }

  /**
   * Process and dispatch a message by its ID.
   */
  async processMessage(messageId: string): Promise<void> {
    const msg = await this.prisma.whatsAppMessage.findUnique({
      where: { id: messageId },
      include: { designer: true, customer: true },
    });

    if (!msg) return;

    const payload = msg.templatePayload as any;
    const isSandbox =
      msg.designer.whatsappSandboxMode ||
      this.configService.get<string>('WHATSAPP_SANDBOX_MODE') !== 'false';

    const phoneNumberId =
      msg.designer.whatsappPhoneNumberId ||
      this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID');

    const accessToken =
      msg.designer.whatsappAccessToken ||
      this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');

    // SANDBOX / MOCK MODE
    if (isSandbox || !phoneNumberId || !accessToken) {
      this.logger.log(
        `[WHATSAPP SANDBOX MODE] Message to ${payload.recipient}:\n${payload.body}`,
      );
      await this.prisma.whatsAppMessage.update({
        where: { id: messageId },
        data: {
          status: WaMessageStatus.MOCK_SENT,
          sentAt: new Date(),
          deliveredAt: new Date(),
          attemptCount: { increment: 1 },
        },
      });
      return;
    }

    // LIVE MODE: Call official Meta WhatsApp Business Cloud API
    try {
      await this.prisma.whatsAppMessage.update({
        where: { id: messageId },
        data: { status: WaMessageStatus.SENDING, attemptCount: { increment: 1 } },
      });

      const response = await axios.post(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: payload.recipient.replace('+', ''),
          type: 'text',
          text: {
            preview_url: false,
            body: payload.body,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 15000,
        },
      );

      const providerMessageId = response.data?.messages?.[0]?.id;

      await this.prisma.whatsAppMessage.update({
        where: { id: messageId },
        data: {
          status: WaMessageStatus.SENT,
          providerMessageId,
          sentAt: new Date(),
        },
      });

      this.logger.log(`WhatsApp live message sent. Provider ID: ${providerMessageId}`);
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      const errorCode = error.response?.data?.error?.code?.toString() || 'SEND_ERROR';

      this.logger.error(`Failed to send WhatsApp message: ${errorMsg}`);

      await this.prisma.whatsAppMessage.update({
        where: { id: messageId },
        data: {
          status: WaMessageStatus.FAILED,
          errorCode,
          errorMessage: errorMsg,
        },
      });
    }
  }

  /**
   * Handle incoming Meta WhatsApp Webhook updates (delivery receipts)
   */
  async handleWebhookPayload(payload: any): Promise<void> {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value || !value.statuses) return;

    for (const statusUpdate of value.statuses) {
      const providerId = statusUpdate.id;
      const status = statusUpdate.status; // 'sent' | 'delivered' | 'read' | 'failed'

      let newStatus: WaMessageStatus = WaMessageStatus.SENT;
      const updateData: any = {};

      if (status === 'delivered' || status === 'read') {
        newStatus = WaMessageStatus.DELIVERED;
        updateData.deliveredAt = new Date();
      } else if (status === 'failed') {
        newStatus = WaMessageStatus.FAILED;
        updateData.errorCode = statusUpdate.errors?.[0]?.code?.toString() || 'WEBHOOK_FAILED';
        updateData.errorMessage = statusUpdate.errors?.[0]?.title || 'Delivery failed';
      }

      updateData.status = newStatus;

      await this.prisma.whatsAppMessage.updateMany({
        where: { providerMessageId: providerId },
        data: updateData,
      });

      this.logger.log(`Webhook updated status for message ${providerId} to ${newStatus}`);
    }
  }

  /**
   * Retry sending a failed message
   */
  async retryMessage(designerId: string, messageId: string): Promise<WhatsAppMessage> {
    const msg = await this.prisma.whatsAppMessage.findFirst({
      where: { id: messageId, designerId },
    });

    if (!msg) {
      throw new NotFoundException('WhatsApp message not found');
    }

    await this.processMessage(messageId);

    return this.prisma.whatsAppMessage.findUnique({
      where: { id: messageId },
    }) as Promise<WhatsAppMessage>;
  }

  /**
   * List message history for order or customer
   */
  async getMessagesForOrder(designerId: string, orderId: string): Promise<WhatsAppMessage[]> {
    return this.prisma.whatsAppMessage.findMany({
      where: { designerId, orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
