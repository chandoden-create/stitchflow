import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException } from '@nestjs/common';
import { ConsentStatus, Prisma } from '@prisma/client';

describe('CustomersService', () => {
  let service: CustomersService;
  let prisma: any;

  const mockDesignerId = 'designer_123';

  beforeEach(async () => {
    prisma = {
      customer: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      order: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  describe('Customer Creation and Duplicate Detection', () => {
    it('should create customer with normalized phone number', async () => {
      prisma.customer.findUnique.mockResolvedValue(null);
      prisma.customer.create.mockImplementation(({ data }: any) => ({
        id: 'cust_1',
        ...data,
      }));

      const result = await service.create(mockDesignerId, {
        name: 'Priya Sharma',
        whatsappNumber: '9876543210', // Raw 10 digits
        consentStatus: ConsentStatus.GIVEN,
      });

      expect(prisma.customer.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            name: 'Priya Sharma',
            whatsappNumber: '+919876543210', // Normalized with +91
            consentStatus: ConsentStatus.GIVEN,
          }),
        }),
      );
      expect(result.whatsappNumber).toBe('+919876543210');
    });

    it('should throw ConflictException on duplicate WhatsApp number for same designer', async () => {
      prisma.customer.findUnique.mockResolvedValue({
        id: 'existing_cust',
        designerId: mockDesignerId,
        whatsappNumber: '+919876543210',
      });

      await expect(
        service.create(mockDesignerId, {
          name: 'Another Priya',
          whatsappNumber: '+91 98765-43210',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('Customer Statistics Aggregation', () => {
    it('should compute totalOrders, totalBilled, totalPaid, and outstanding balance', async () => {
      prisma.customer.findFirst.mockResolvedValue({
        id: 'cust_1',
        designerId: mockDesignerId,
        name: 'Priya Sharma',
      });

      prisma.order.findMany.mockResolvedValue([
        {
          finalTotal: new Prisma.Decimal('1500.00'),
          balanceDue: new Prisma.Decimal('500.00'),
          payments: [
            { amount: new Prisma.Decimal('1000.00') },
          ],
        },
        {
          finalTotal: new Prisma.Decimal('800.00'),
          balanceDue: new Prisma.Decimal('0.00'),
          payments: [
            { amount: new Prisma.Decimal('800.00') },
          ],
        },
      ]);

      const stats = await service.getCustomerStats('cust_1');

      expect(stats.totalOrders).toBe(2);
      expect(stats.totalBilled).toBe('2300.00'); // 1500 + 800
      expect(stats.totalPaid).toBe('1800.00');   // 1000 + 800
      expect(stats.outstanding).toBe('500.00');  // 500 + 0
    });
  });
});
