import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer, ConsentStatus, Prisma } from '@prisma/client';
import { normalizePhoneNumber } from '../common/utils/phone.util';
import { decimalSum, decimalSub, toDecimalString } from '../common/utils/decimal.util';
import Decimal from 'decimal.js';

export interface CustomerStats {
  totalOrders: number;
  totalBilled: string;
  totalPaid: string;
  outstanding: string;
}

export interface PaginatedCustomers {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(designerId: string, dto: CreateCustomerDto): Promise<Customer> {
    const normalizedPhone = normalizePhoneNumber(dto.whatsappNumber);

    const existing = await this.prisma.customer.findUnique({
      where: {
        designerId_whatsappNumber: {
          designerId,
          whatsappNumber: normalizedPhone,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `A customer with WhatsApp number ${normalizedPhone} already exists`,
      );
    }

    const normalizedAlt = dto.altPhone ? normalizePhoneNumber(dto.altPhone) : undefined;

    const customer = await this.prisma.customer.create({
      data: {
        designerId,
        name: dto.name,
        whatsappNumber: normalizedPhone,
        altPhone: normalizedAlt,
        notes: dto.notes,
        consentStatus: dto.consentStatus ?? ConsentStatus.PENDING,
        consentRecordedAt:
          dto.consentStatus === ConsentStatus.GIVEN ? new Date() : null,
      },
    });

    this.logger.log(`Customer created: ${customer.name} for designer ${designerId}`);
    return customer;
  }

  async findAll(
    designerId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
    } = {},
  ): Promise<PaginatedCustomers> {
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CustomerWhereInput = {
      designerId,
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search, mode: 'insensitive' } },
              {
                whatsappNumber: {
                  contains: options.search,
                  mode: 'insensitive',
                },
              },
              {
                altPhone: {
                  contains: options.search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(designerId: string, customerId: string): Promise<Customer & { stats: CustomerStats }> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, designerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }

    const stats = await this.getCustomerStats(customerId);

    return { ...customer, stats };
  }

  async update(
    designerId: string,
    customerId: string,
    dto: UpdateCustomerDto,
  ): Promise<Customer> {
    await this.findOne(designerId, customerId);

    const updateData: Prisma.CustomerUpdateInput = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.consentStatus !== undefined) {
      updateData.consentStatus = dto.consentStatus;
      if (dto.consentStatus === ConsentStatus.GIVEN) {
        updateData.consentRecordedAt = new Date();
      }
    }

    if (dto.whatsappNumber !== undefined) {
      const normalized = normalizePhoneNumber(dto.whatsappNumber);

      const conflict = await this.prisma.customer.findFirst({
        where: {
          designerId,
          whatsappNumber: normalized,
          NOT: { id: customerId },
        },
      });

      if (conflict) {
        throw new ConflictException(
          `Another customer already has WhatsApp number ${normalized}`,
        );
      }

      updateData.whatsappNumber = normalized;
    }

    if (dto.altPhone !== undefined) {
      updateData.altPhone = dto.altPhone ? normalizePhoneNumber(dto.altPhone) : null;
    }

    return this.prisma.customer.update({
      where: { id: customerId },
      data: updateData,
    });
  }

  async remove(designerId: string, customerId: string): Promise<{ message: string }> {
    await this.findOne(designerId, customerId);

    const orderCount = await this.prisma.order.count({
      where: { customerId },
    });

    if (orderCount > 0) {
      throw new BadRequestException(
        `Cannot delete customer with ${orderCount} associated order(s). Archive orders first.`,
      );
    }

    await this.prisma.customer.delete({ where: { id: customerId } });
    return { message: 'Customer deleted successfully' };
  }

  async getCustomerOrders(designerId: string, customerId: string) {
    await this.findOne(designerId, customerId);

    return this.prisma.order.findMany({
      where: { customerId, designerId },
      include: {
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCustomerStats(customerId: string): Promise<CustomerStats> {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: { payments: true },
    });

    const totalOrders = orders.length;

    const totalBilledDecimal = decimalSum(
      orders.map((o) => o.finalTotal.toString()),
    );

    const totalPaidDecimal = decimalSum(
      orders.flatMap((o) => o.payments.map((p) => p.amount.toString())),
    );

    const outstanding = decimalSub(totalBilledDecimal, totalPaidDecimal);

    return {
      totalOrders,
      totalBilled: toDecimalString(totalBilledDecimal),
      totalPaid: toDecimalString(totalPaidDecimal),
      outstanding: toDecimalString(outstanding.lt(0) ? new Decimal(0) : outstanding),
    };
  }
}
