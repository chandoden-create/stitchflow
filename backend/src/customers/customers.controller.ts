import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentDesigner } from '../common/decorators/current-designer.decorator';
import { ParseCuidPipe } from '../common/pipes/parse-cuid.pipe';
import { Designer } from '@prisma/client';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  create(
    @CurrentDesigner() designer: Designer,
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customersService.create(designer.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all customers with pagination and search' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @CurrentDesigner() designer: Designer,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
  ) {
    return this.customersService.findAll(designer.id, { page, limit, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer detail with order stats' })
  findOne(
    @CurrentDesigner() designer: Designer,
    @Param('id', ParseCuidPipe) id: string,
  ) {
    return this.customersService.findOne(designer.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update customer details' })
  update(
    @CurrentDesigner() designer: Designer,
    @Param('id', ParseCuidPipe) id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(designer.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete customer (only if no orders exist)' })
  remove(
    @CurrentDesigner() designer: Designer,
    @Param('id', ParseCuidPipe) id: string,
  ) {
    return this.customersService.remove(designer.id, id);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get all orders for a customer' })
  getOrders(
    @CurrentDesigner() designer: Designer,
    @Param('id', ParseCuidPipe) id: string,
  ) {
    return this.customersService.getCustomerOrders(designer.id, id);
  }
}
