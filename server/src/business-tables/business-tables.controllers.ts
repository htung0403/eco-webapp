import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { RequireRoles } from '../auth/decorators/require-roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles';
import { BusinessResource, BusinessTablesService, QueryBusinessDto } from './business-tables.service';

abstract class BusinessCrudController {
  protected abstract readonly resource: BusinessResource;

  constructor(protected readonly service: BusinessTablesService) {}

  @Get()
  list(@Query() query: QueryBusinessDto) {
    return this.service.list(this.resource, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(this.resource, id);
  }

  @Post()
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  create(@Body() body: Record<string, unknown>) {
    return this.service.create(this.resource, body);
  }

  @Patch(':id')
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.service.update(this.resource, id, body);
  }

  @Delete(':id')
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  async remove(@Param('id') id: string) {
    await this.service.remove(this.resource, id);
    return { success: true };
  }
}

@ApiTags('Vehicle Directory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicle-directory')
export class VehicleDirectoryController extends BusinessCrudController { protected readonly resource = 'vehicleDirectory' as const; }

@ApiTags('Vehicle Costs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vehicle-costs')
export class VehicleCostsController extends BusinessCrudController { protected readonly resource = 'vehicleCosts' as const; }

@ApiTags('Cash Transaction Details')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash-transaction-details')
export class CashTransactionDetailsController extends BusinessCrudController { protected readonly resource = 'cashTransactionDetails' as const; }

@ApiTags('North South Shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('north-south-shipments')
export class NorthSouthShipmentsController extends BusinessCrudController { protected readonly resource = 'northSouthShipments' as const; }

@ApiTags('Staff Members')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('staff-members')
export class StaffMembersController extends BusinessCrudController { protected readonly resource = 'staffMembers' as const; }

@ApiTags('Carrier Directory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('carrier-directory')
export class CarrierDirectoryController extends BusinessCrudController { protected readonly resource = 'carrierDirectory' as const; }

@ApiTags('Chanh Shipments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chanh-shipments')
export class ChanhShipmentsController extends BusinessCrudController { protected readonly resource = 'chanhShipments' as const; }

@ApiTags('Customer Directory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customer-directory')
export class CustomerDirectoryController extends BusinessCrudController { protected readonly resource = 'customerDirectory' as const; }

@ApiTags('Cash Journal Entries')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cash-journal-entries')
export class CashJournalEntriesController extends BusinessCrudController { protected readonly resource = 'cashJournalEntries' as const; }

@ApiTags('Warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('warehouses')
export class WarehousesController extends BusinessCrudController { protected readonly resource = 'warehouses' as const; }

export const businessTableControllers = [VehicleDirectoryController, VehicleCostsController, CashTransactionDetailsController, NorthSouthShipmentsController, StaffMembersController, CarrierDirectoryController, ChanhShipmentsController, CustomerDirectoryController, CashJournalEntriesController, WarehousesController];
