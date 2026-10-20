import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappService } from './whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { WaMessageType, WaMessageStatus, ConsentStatus, Prisma } from '@prisma/client';
import { BadRequestException } from '@nestjs/common';

describe('WhatsappService', () => {
  let service: WhatsappService;
  let prisma: any;
  let config: any;

  const mockDesignerId = 'designer_123';
  const mockOrderId = 'order_456';

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn(),
      },
      whatsAppMessage: {
        create: jest.fn(),
        update: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
    };

    config = {
      get: jest.fn((key: string) => {
        if (key === 'WHATSAPP_SANDBOX_MODE') return 'true';
        if (key === 'WHATSAPP_PHONE_NUMBER_ID') return '123456789';
        if (key === 'WHATSAPP_ACCESS_TOKEN') return 'EAABmocktoken';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappService,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = module.get<WhatsappService>(WhatsappService);
  });

  describe('Sandbox / Mock Notification Handling', () => {
    it('should set status to MOCK_SENT in sandbox mode without throwing', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: mockOrderId,
        orderNumber: 'SF-1001',
        finalTotal: new Prisma.Decimal('1500.00'),
        advanceAmount: new Prisma.Decimal('500.00'),
        balanceDue: new Prisma.Decimal('1000.00'),
        customer: {
          id: 'cust_1',
          name: 'Priya Sharma',
          whatsappNumber: '+919876543210',
          consentStatus: ConsentStatus.GIVEN,
        },
        designer: {
          id: mockDesignerId,
          businessName: 'Bhagyashri Tailoring',
          currencySymbol: '₹',
          whatsappSandboxMode: true,
          messageSignature: 'Bhagyashri',
        },
        items: [
          { description: 'Designer blouse stitching', quantity: 1, lineTotal: new Prisma.Decimal('800.00') },
          { description: 'Blouse fitting', quantity: 2, lineTotal: new Prisma.Decimal('400.00') },
          { description: 'Dress alteration', quantity: 1, lineTotal: new Prisma.Decimal('300.00') },
        ],
        payments: [{ amount: new Prisma.Decimal('500.00') }],
      });

      prisma.whatsAppMessage.create.mockResolvedValue({
        id: 'msg_1',
        orderId: mockOrderId,
        messageType: WaMessageType.ORDER_RECEIVED,
        status: WaMessageStatus.QUEUED,
        templatePayload: { recipient: '+919876543210' },
      });

      prisma.whatsAppMessage.findUnique.mockResolvedValue({
        id: 'msg_1',
        status: WaMessageStatus.MOCK_SENT,
        designer: { whatsappSandboxMode: true },
        customer: { whatsappNumber: '+919876543210' },
        templatePayload: { recipient: '+919876543210', body: 'Test message body' },
      });

      await service.queueOrderReceivedNotification(mockDesignerId, mockOrderId);

      expect(prisma.whatsAppMessage.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'msg_1' },
          data: expect.objectContaining({
            status: WaMessageStatus.MOCK_SENT,
          }),
        }),
      );
    });

    it('should refuse to send when customer consent is revoked', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: mockOrderId,
        customer: {
          id: 'cust_1',
          name: 'Priya Sharma',
          consentStatus: ConsentStatus.REVOKED,
        },
        designer: { id: mockDesignerId },
        items: [],
        payments: [],
      });

      await expect(
        service.createAndDispatchMessage(
          mockDesignerId,
          mockOrderId,
          WaMessageType.ORDER_RECEIVED,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Webhook Delivery Updates', () => {
    it('should update message status to DELIVERED upon receiving webhook event', async () => {
      const webhookPayload = {
        entry: [
          {
            changes: [
              {
                value: {
                  statuses: [
                    {
                      id: 'wamid.HBgLM...',
                      status: 'delivered',
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      await service.handleWebhookPayload(webhookPayload);

      expect(prisma.whatsAppMessage.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { providerMessageId: 'wamid.HBgLM...' },
          data: expect.objectContaining({
            status: WaMessageStatus.DELIVERED,
          }),
        }),
      );
    });
  });
});
