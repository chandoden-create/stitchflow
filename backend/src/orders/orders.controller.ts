import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService, DashboardStats, PaginatedOrders } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { AddPaymentDto } from './dto/add-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentDesigner } from '../common/decorators/current-designer.decorator';
import { OrderStatus } from '@prisma/client';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order with items and optional advance payment' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or invalid amounts' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async create(
    @CurrentDesigner('id') designerId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.create(designerId, dto);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics for the authenticated designer' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics and recent orders' })
  async getDashboard(@CurrentDesigner('id') designerId: string): Promise<DashboardStats> {
    return this.ordersService.getDashboardStats(designerId);
  }

  @Get()
  @ApiOperation({ summary: 'List orders with filtering, search, and pagination' })
  @ApiQuery({ name: 'status', enum: OrderStatus, required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'search', required: false, description: 'Search order number or customer name/phone' })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['createdAt', 'dueDate', 'orderNumber'] })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  async findAll(
    @CurrentDesigner('id') designerId: string,
    @Query('status') status?: OrderStatus,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ): Promise<PaginatedOrders> {
    return this.ordersService.findAll(designerId, {
      status,
      customerId,
      search,
      dateFrom,
      dateTo,
      page,
      limit,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full order details including items, photos, payments, and history' })
  @ApiResponse({ status: 200, description: 'Order details' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(
    @CurrentDesigner('id') designerId: string,
    @Param('id') id: string,
  ) {
    return this.ordersService.findOne(designerId, id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Transition order status (RECEIVED -> IN_PROGRESS -> COMPLETED -> DELIVERED)' })
  @ApiResponse({ status: 200, description: 'Status updated and notification queued' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async updateStatus(
    @CurrentDesigner('id') designerId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(designerId, id, dto);
  }

  @Post(':id/payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record payment for an order and update balance due' })
  @ApiResponse({ status: 201, description: 'Payment recorded successfully' })
  @ApiResponse({ status: 400, description: 'Payment amount exceeds balance or invalid' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async addPayment(
    @CurrentDesigner('id') designerId: string,
    @Param('id') id: string,
    @Body() dto: AddPaymentDto,
  ) {
    return this.ordersService.addPayment(designerId, id, dto);
  }
}
