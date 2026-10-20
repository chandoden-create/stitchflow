import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GarmentType, OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import Decimal from 'decimal.js';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;
  let whatsapp: any;

  const mockDesignerId = 'designer_123';
  const mockCustomerId = 'customer_456';

  beforeEach(async () => {
    prisma = {
      customer: {
        findFirst: jest.fn(),
      },
      order: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    whatsapp = {
      queueOrderReceivedNotification: jest.fn().mockResolvedValue({}),
      queueOrderCompletedNotification: jest.fn().mockResolvedValue({}),
      queueOrderDeliveredNotification: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prisma },
        { provide: WhatsappService, useValue: whatsapp },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  describe('Order Total & Balance Calculation', () => {
    it('should accurately calculate subtotal, discount, charges, and final total', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: mockCustomerId, designerId: mockDesignerId });
      prisma.order.findFirst.mockResolvedValue(null); // for order number generation

      const createOrderDto = {
        customerId: mockCustomerId,
        items: [
          {
            garmentType: GarmentType.BLOUSE_STITCHING,
            description: 'Designer blouse stitching',
            quantity: 1,
            unitPrice: '800.00',
          },
          {
            garmentType: GarmentType.BLOUSE_FITTING,
            description: 'Blouse fitting',
            quantity: 2,
            unitPrice: '200.00',
          },
          {
            garmentType: GarmentType.ALTERATION,
            description: 'Dress alteration',
            quantity: 1,
            unitPrice: '300.00',
          },
        ],
        discount: '0.00',
        additionalCharges: '0.00',
        advanceAmount: '500.00',
      };

      prisma.order.create.mockImplementation(({ data }: any) => ({
        id: 'order_1',
        ...data,
      }));

      // mock findOne for the returned result
      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'order_1',
        orderNumber: 'SF-0001',
        subtotal: new Prisma.Decimal('1500.00'),
        discount: new Prisma.Decimal('0.00'),
        additionalCharges: new Prisma.Decimal('0.00'),
        finalTotal: new Prisma.Decimal('1500.00'),
        advanceAmount: new Prisma.Decimal('500.00'),
        balanceDue: new Prisma.Decimal('1000.00'),
      } as any);

      const result = await service.create(mockDesignerId, createOrderDto as any);

      // Verify Prisma order creation received calculated amounts
      expect(prisma.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderNumber: 'SF-0001',
            subtotal: new Prisma.Decimal('1500.00'),
            finalTotal: new Prisma.Decimal('1500.00'),
            advanceAmount: new Prisma.Decimal('500.00'),
            balanceDue: new Prisma.Decimal('1000.00'),
          }),
        }),
      );

      // Verify advance payment was recorded in Payment ledger
      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: new Prisma.Decimal('500.00'),
            paymentMethod: PaymentMethod.CASH,
          }),
        }),
      );

      // Verify WhatsApp notification was queued
      expect(whatsapp.queueOrderReceivedNotification).toHaveBeenCalled();
      expect(new Decimal(result.balanceDue.toString()).toFixed(2)).toBe('1000.00');
    });

    it('should reject advance payment greater than final total', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: mockCustomerId, designerId: mockDesignerId });

      const dto = {
        customerId: mockCustomerId,
        items: [
          {
            garmentType: GarmentType.BLOUSE_STITCHING,
            description: 'Blouse',
            quantity: 1,
            unitPrice: '500.00',
          },
        ],
        advanceAmount: '600.00', // exceeds 500
      };

      await expect(service.create(mockDesignerId, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject negative unit price', async () => {
      prisma.customer.findFirst.mockResolvedValue({ id: mockCustomerId, designerId: mockDesignerId });

      const dto = {
        customerId: mockCustomerId,
        items: [
          {
            garmentType: GarmentType.BLOUSE_STITCHING,
            description: 'Blouse',
            quantity: 1,
            unitPrice: '-500.00',
          },
        ],
      };

      await expect(service.create(mockDesignerId, dto as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('Status Transition Lifecycle', () => {
    it('should allow RECEIVED -> IN_PROGRESS transition', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'order_1',
        designerId: mockDesignerId,
        status: OrderStatus.RECEIVED,
      });

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'order_1',
        status: OrderStatus.IN_PROGRESS,
      } as any);

      const result = await service.updateStatus(mockDesignerId, 'order_1', {
        status: OrderStatus.IN_PROGRESS,
      });

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order_1' },
          data: { status: OrderStatus.IN_PROGRESS },
        }),
      );
      expect(result.status).toBe(OrderStatus.IN_PROGRESS);
    });

    it('should disallow invalid transition from RECEIVED directly to DELIVERED', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'order_1',
        designerId: mockDesignerId,
        status: OrderStatus.RECEIVED,
      });

      await expect(
        service.updateStatus(mockDesignerId, 'order_1', {
          status: OrderStatus.DELIVERED,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should disallow any transition from terminal DELIVERED status', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'order_1',
        designerId: mockDesignerId,
        status: OrderStatus.DELIVERED,
      });

      await expect(
        service.updateStatus(mockDesignerId, 'order_1', {
          status: OrderStatus.IN_PROGRESS,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should queue WhatsApp notification when order transitions to COMPLETED', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'order_1',
        designerId: mockDesignerId,
        status: OrderStatus.IN_PROGRESS,
      });

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'order_1',
        status: OrderStatus.COMPLETED,
      } as any);

      await service.updateStatus(mockDesignerId, 'order_1', {
        status: OrderStatus.COMPLETED,
      });

      expect(whatsapp.queueOrderCompletedNotification).toHaveBeenCalledWith(
        mockDesignerId,
        'order_1',
      );
    });
  });

  describe('Payment Ledger and Outstanding Balance', () => {
    it('should record payment and deduct from balance due', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'order_1',
        designerId: mockDesignerId,
        balanceDue: new Prisma.Decimal('1000.00'),
        status: OrderStatus.IN_PROGRESS,
      });

      jest.spyOn(service, 'findOne').mockResolvedValue({
        id: 'order_1',
        balanceDue: new Prisma.Decimal('600.00'),
      } as any);

      await service.addPayment(mockDesignerId, 'order_1', {
        amount: '400.00',
        paymentMethod: PaymentMethod.UPI,
        transactionRef: 'UPI-1234567890',
      });

      expect(prisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderId: 'order_1',
            amount: new Prisma.Decimal('400.00'),
            paymentMethod: PaymentMethod.UPI,
            transactionRef: 'UPI-1234567890',
          }),
        }),
      );

      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order_1' },
          data: {
            balanceDue: new Prisma.Decimal('600.00'),
          },
        }),
      );
    });

    it('should reject payment greater than remaining balance', async () => {
      prisma.order.findFirst.mockResolvedValue({
        id: 'order_1',
        designerId: mockDesignerId,
        balanceDue: new Prisma.Decimal('500.00'),
        status: OrderStatus.IN_PROGRESS,
      });

      await expect(
        service.addPayment(mockDesignerId, 'order_1', {
          amount: '600.00', // exceeds balance of 500
          paymentMethod: PaymentMethod.CASH,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
