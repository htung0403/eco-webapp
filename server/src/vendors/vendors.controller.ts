import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireRoles } from '../auth/decorators/require-roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles';
import { UserEntity } from '../users/user.entity';
import { QueryVendorsDto } from './dto/query-vendors.dto';
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';
import { UpsertVendorDto } from './dto/upsert-vendor.dto';
import { VendorsService } from './vendors.service';

@ApiTags('Vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Create vendor configuration' })
  create(@Body() dto: UpsertVendorDto, @CurrentUser() currentUser: UserEntity) {
    return this.vendorsService.create(dto, currentUser);
  }

  @Get()
  @RequireRoles(Roles.DISPATCHER, Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'List vendor configurations' })
  findAll(@Query() query: QueryVendorsDto) {
    return this.vendorsService.findAll(query);
  }

  @Get('active')
  @RequireRoles(Roles.DISPATCHER, Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'List active vendors' })
  findActive(@Query() query: QueryVendorsDto) {
    return this.vendorsService.findActive(query);
  }

  @Get(':id')
  @RequireRoles(Roles.DISPATCHER, Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Get vendor detail' })
  findOne(@Param('id') id: string) {
    return this.vendorsService.findOne(id);
  }

  @Patch(':id')
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Update vendor information' })
  update(@Param('id') id: string, @Body() dto: UpsertVendorDto, @CurrentUser() currentUser: UserEntity) {
    return this.vendorsService.update(id, dto, currentUser);
  }

  @Patch(':id/status')
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Enable or disable vendor' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateVendorStatusDto, @CurrentUser() currentUser: UserEntity) {
    return this.vendorsService.updateStatus(id, dto, currentUser);
  }

  @Patch(':id/routes')
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Update vendor service routes' })
  updateRoutes(@Param('id') id: string, @Body() body: Record<string, unknown> | unknown[], @CurrentUser() currentUser: UserEntity) {
    return this.vendorsService.updateRoutes(id, body, currentUser);
  }

  @Patch(':id/pricing')
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Update vendor reference pricing' })
  updatePricing(@Param('id') id: string, @Body() body: Record<string, unknown> | unknown[], @CurrentUser() currentUser: UserEntity) {
    return this.vendorsService.updatePricing(id, body, currentUser);
  }

  @Delete(':id')
  @RequireRoles(Roles.DIRECTOR)
  @ApiOperation({ summary: 'Delete vendor configuration' })
  delete(@Param('id') id: string, @CurrentUser() currentUser: UserEntity) {
    return this.vendorsService.delete(id, currentUser);
  }
}
