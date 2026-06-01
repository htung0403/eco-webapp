import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequireRoles } from '../auth/decorators/require-roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Danh sách khách hàng (view v_customer_list)' })
  findAll(@Query() query: QueryCustomersDto) {
    return this.customersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Chi tiết khách hàng' })
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @RequireRoles(Roles.WAREHOUSE, Roles.PACKER, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Tạo khách hàng mới' })
  create(@Body() dto: CreateCustomerDto) {
    return this.customersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @RequireRoles(Roles.WAREHOUSE, Roles.PACKER, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Cập nhật khách hàng' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa khách hàng (soft delete)' })
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}
