import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { Order, OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { generateOrderNumber } from '../common/utils/order-number.util';
import {
  decimalAdd,
  decimalSub,
  decimalMul,
  decimalSum,
  toDecimalString,
  isNonNegative,
} from '../common/utils/decimal.util';
import Decimal from 'decimal.js';
import { WhatsappService } from '../whatsapp/whatsapp.service';

export interface DashboardStats {
  totalCustomers: number;
  ordersReceivedToday: number;
  pendingOrders: number;
  inProgressOrders: number;
  completedOrders: number;
  deliveredOrders: number;
  totalOutstanding: string;
  totalRevenue: string;
  recentOrders: any[];
}

export interface PaginatedOrders {
  data: any[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => WhatsappService))
    private readonly whatsappService: WhatsappService,
  ) {}

  /**
   * Create a new order with items and optional advance payment.
   * Recalculates all totals server-side using Decimal.js.
   */
  async create(designerId: string, dto: CreateOrderDto): Promise<Order> {
    // 1. Verify customer belongs to this designer
    const customer = await this.prisma.customer.findFirst({
      where: { id: dto.customerId, designerId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found or does not belong to this designer');
    }

    // 2. Validate items and calculate subtotal using decimal arithmetic
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one garment item');
    }

    const calculatedItems = dto.items.map((item, index) => {
      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const unitPriceDec = new Decimal(item.unitPrice);
      if (unitPriceDec.isNegative()) {
        throw new BadRequestException(`Unit price for item #${index + 1} cannot be negative`);
      }
      const lineTotalDec = decimalMul(qty, unitPriceDec);

      return {
        garmentType: item.garmentType,
        description: item.description,
        quantity: qty,
        unitPrice: new Prisma.Decimal(toDecimalString(unitPriceDec)),
        lineTotal: new Prisma.Decimal(toDecimalString(lineTotalDec)),
        notes: item.notes || null,
        sortOrder: item.sortOrder ?? index,
        _lineTotalDec: lineTotalDec,
      };
    });

    const subtotalDec = calculatedItems.reduce<Decimal>(
      (acc, it) => acc.plus(it._lineTotalDec),
      new Decimal(0),
    );

    const discountDec = dto.discount ? new Decimal(dto.discount) : new Decimal(0);
    if (discountDec.isNegative()) {
      throw new BadRequestException('Discount cannot be negative');
    }

    const additionalChargesDec = dto.additionalCharges
      ? new Decimal(dto.additionalCharges)
      : new Decimal(0);
    if (additionalChargesDec.isNegative()) {
      throw new BadRequestException('Additional charges cannot be negative');
    }

    // Final Total = Subtotal - Discount + Additional Charges
    const finalTotalDec = decimalAdd(
      decimalSub(subtotalDec, discountDec),
      additionalChargesDec,
    );

    if (finalTotalDec.isNegative()) {
      throw new BadRequestException('Final order total cannot be negative');
    }

    const advanceDec = dto.advanceAmount ? new Decimal(dto.advanceAmount) : new Decimal(0);
    if (advanceDec.isNegative()) {
      throw new BadRequestException('Advance payment amount cannot be negative');
    }
    if (advanceDec.gt(finalTotalDec)) {
      throw new BadRequestException('Advance payment cannot exceed final total');
    }

    // Remaining balance = Final Total - Advance Amount
    const balanceDueDec = decimalSub(finalTotalDec, advanceDec);

    // 3. Generate human readable order number
    const orderNumber = await generateOrderNumber(this.prisma, designerId);

    // 4. Save order in transaction
    const createdOrder = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          designerId,
          customerId: dto.customerId,
          orderNumber,
          status: OrderStatus.RECEIVED,
          subtotal: new Prisma.Decimal(toDecimalString(subtotalDec)),
          discount: new Prisma.Decimal(toDecimalString(discountDec)),
          additionalCharges: new Prisma.Decimal(toDecimalString(additionalChargesDec)),
          finalTotal: new Prisma.Decimal(toDecimalString(finalTotalDec)),
          advanceAmount: new Prisma.Decimal(toDecimalString(advanceDec)),
          balanceDue: new Prisma.Decimal(toDecimalString(balanceDueDec)),
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          notes: dto.notes || null,
          items: {
            create: calculatedItems.map(({ _lineTotalDec, ...rest }) => rest),
          },
        },
        include: {
          items: true,
          customer: true,
        },
      });

      // If advance payment was made, record in Payment ledger
      if (advanceDec.gt(0)) {
        await tx.payment.create({
          data: {
            orderId: order.id,
            amount: new Prisma.Decimal(toDecimalString(advanceDec)),
            paymentMethod: PaymentMethod.CASH,
            notes: 'Advance payment received at order creation',
            receivedAt: new Date(),
          },
        });
      }

      // Record in status audit history
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          previousStatus: null,
          newStatus: OrderStatus.RECEIVED,
          changedBy: designerId,
          notes: 'Order received and registered',
        },
      });

      return order;
    });

    // 5. Asynchronously queue WhatsApp ORDER_RECEIVED notification
    try {
      await this.whatsappService.queueOrderReceivedNotification(designerId, createdOrder.id);
    } catch (err) {
      this.logger.warn(`Failed to queue WhatsApp notification for order ${orderNumber}: ${err.message}`);
    }

    return this.findOne(designerId, createdOrder.id);
  }

  /**
   * Find all orders with pagination, search, and filters.
   */
  async findAll(
    designerId: string,
    query: {
      status?: OrderStatus;
      customerId?: string;
      search?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<PaginatedOrders> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.OrderWhereInput = {
      designerId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.search) {
      const term = query.search.trim();
      where.OR = [
        { orderNumber: { contains: term, mode: 'insensitive' } },
        { customer: { name: { contains: term, mode: 'insensitive' } } },
        { customer: { whatsappNumber: { contains: term } } },
      ];
    }

    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) {
        where.createdAt.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.createdAt.lte = new Date(query.dateTo);
      }
    }

    const orderBy: Prisma.OrderOrderByWithRelationInput = {};
    const sortField = query.sortBy || 'createdAt';
    const direction = query.sortOrder === 'asc' ? 'asc' : 'desc';

    if (sortField === 'dueDate') {
      orderBy.dueDate = direction;
    } else if (sortField === 'orderNumber') {
      orderBy.orderNumber = direction;
    } else {
      orderBy.createdAt = direction;
    }

    const [total, data] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              whatsappNumber: true,
            },
          },
          items: {
            select: {
              id: true,
              garmentType: true,
              description: true,
              quantity: true,
              unitPrice: true,
              lineTotal: true,
              photos: {
                select: {
                  id: true,
                  storageKey: true,
                },
              },
            },
          },
          _count: {
            select: {
              items: true,
              payments: true,
            },
          },
        },
      }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single order details with items, photos, payments, status history, and messages.
   */
  async findOne(designerId: string, id: string): Promise<any> {
    const order = await this.prisma.order.findFirst({
      where: { id, designerId },
      include: {
        customer: true,
        items: {
          orderBy: { sortOrder: 'asc' },
          include: {
            photos: true,
          },
        },
        payments: {
          orderBy: { receivedAt: 'desc' },
        },
        statusHistory: {
          orderBy: { changedAt: 'desc' },
        },
        whatsappMessages: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  /**
   * Update order status following state lifecycle:
   * RECEIVED -> IN_PROGRESS -> COMPLETED -> DELIVERED
   * CANCELLED is allowed from RECEIVED or IN_PROGRESS.
   */
  async updateStatus(
    designerId: string,
    id: string,
    dto: UpdateOrderStatusDto,
  ): Promise<any> {
    const order = await this.prisma.order.findFirst({
      where: { id, designerId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    const currentStatus = order.status;
    const newStatus = dto.status;

    if (currentStatus === newStatus) {
      throw new BadRequestException(`Order is already in status ${currentStatus}`);
    }

    // Validate lifecycle rules
    const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.RECEIVED]: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
      [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
      [OrderStatus.COMPLETED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [], // Terminal state
      [OrderStatus.CANCELLED]: [], // Terminal state
    };

    const validNextStates = allowedTransitions[currentStatus] || [];
    if (!validNextStates.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}. Valid transitions are: ${validNextStates.join(', ') || 'None (terminal status)'}`,
      );
    }

    // Prepare timestamp updates
    const now = new Date();
    const updateData: Prisma.OrderUpdateInput = {
      status: newStatus,
    };

    if (newStatus === OrderStatus.COMPLETED) {
      updateData.completedAt = now;
    } else if (newStatus === OrderStatus.DELIVERED) {
      updateData.deliveredAt = now;
    }

    // Update in transaction with audit history
    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: updateData,
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          previousStatus: currentStatus,
          newStatus,
          changedBy: designerId,
          notes: dto.notes || `Status changed from ${currentStatus} to ${newStatus}`,
          changedAt: now,
        },
      });
    });

    // Queue WhatsApp notifications for COMPLETED and DELIVERED states
    try {
      if (newStatus === OrderStatus.COMPLETED) {
        await this.whatsappService.queueOrderCompletedNotification(designerId, id);
      } else if (newStatus === OrderStatus.DELIVERED) {
        await this.whatsappService.queueOrderDeliveredNotification(designerId, id);
      }
    } catch (err) {
      this.logger.warn(`Failed to queue WhatsApp notification for status transition to ${newStatus}: ${err.message}`);
    }

    return this.findOne(designerId, id);
  }

  /**
   * Record a payment for an order and recalculate balance due safely.
   * Delivery and payment are separate concepts.
   */
  async addPayment(designerId: string, id: string, dto: AddPaymentDto): Promise<any> {
    const order = await this.prisma.order.findFirst({
      where: { id, designerId },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Cannot record payments on cancelled orders');
    }

    const paymentAmountDec = new Decimal(dto.amount);
    if (!paymentAmountDec.isPositive()) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const currentBalanceDueDec = new Decimal(order.balanceDue.toString());

    if (paymentAmountDec.gt(currentBalanceDueDec)) {
      throw new BadRequestException(
        `Payment amount (₹${paymentAmountDec.toFixed(2)}) cannot exceed outstanding balance of ₹${currentBalanceDueDec.toFixed(2)}`,
      );
    }

    const newBalanceDueDec = decimalSub(currentBalanceDueDec, paymentAmountDec);

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: id,
          amount: new Prisma.Decimal(toDecimalString(paymentAmountDec)),
          paymentMethod: dto.paymentMethod,
          transactionRef: dto.transactionRef || null,
          notes: dto.notes || null,
          receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
        },
      });

      await tx.order.update({
        where: { id },
        data: {
          balanceDue: new Prisma.Decimal(toDecimalString(newBalanceDueDec)),
        },
      });
    });

    return this.findOne(designerId, id);
  }

  /**
   * Get dashboard statistics scoped to the authenticated designer.
   */
  async getDashboardStats(designerId: string): Promise<DashboardStats> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalCustomers,
      ordersReceivedToday,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      deliveredOrders,
      activeOrdersWithBalance,
      allPayments,
      recentOrders,
    ] = await Promise.all([
      this.prisma.customer.count({ where: { designerId } }),
      this.prisma.order.count({
        where: { designerId, createdAt: { gte: startOfToday } },
      }),
      this.prisma.order.count({
        where: { designerId, status: OrderStatus.RECEIVED },
      }),
      this.prisma.order.count({
        where: { designerId, status: OrderStatus.IN_PROGRESS },
      }),
      this.prisma.order.count({
        where: { designerId, status: OrderStatus.COMPLETED },
      }),
      this.prisma.order.count({
        where: { designerId, status: OrderStatus.DELIVERED },
      }),
      this.prisma.order.findMany({
        where: {
          designerId,
          status: { not: OrderStatus.CANCELLED },
        },
        select: { balanceDue: true },
      }),
      this.prisma.payment.findMany({
        where: { order: { designerId } },
        select: { amount: true },
      }),
      this.prisma.order.findMany({
        where: { designerId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          customer: {
            select: { id: true, name: true, whatsappNumber: true },
          },
          _count: { select: { items: true } },
        },
      }),
    ]);

    const totalOutstandingDec = activeOrdersWithBalance.reduce<Decimal>(
      (acc, o) => acc.plus(new Decimal(o.balanceDue.toString())),
      new Decimal(0),
    );

    const totalRevenueDec = allPayments.reduce<Decimal>(
      (acc, p) => acc.plus(new Decimal(p.amount.toString())),
      new Decimal(0),
    );

    return {
      totalCustomers,
      ordersReceivedToday,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      deliveredOrders,
      totalOutstanding: toDecimalString(totalOutstandingDec),
      totalRevenue: toDecimalString(totalRevenueDec),
      recentOrders,
    };
  }
}
