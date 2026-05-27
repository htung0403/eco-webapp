import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireRoles } from '../auth/decorators/require-roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles';
import { UserEntity } from '../users/user.entity';
import { ArriveTripDto } from './dto/arrive-trip.dto';
import { AssignManifestDto } from './dto/assign-manifest.dto';
import { CompleteTripDto } from './dto/complete-trip.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { QueryTripsDto } from './dto/query-trips.dto';
import { StartTripDto } from './dto/start-trip.dto';
import { UpdateTripCostsDto } from './dto/update-trip-costs.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripsService } from './trips.service';

@ApiTags('Trips')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  @RequireRoles(Roles.DISPATCHER, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Create a planned trip' })
  create(@Body() dto: CreateTripDto, @CurrentUser() currentUser: UserEntity) {
    return this.tripsService.create(dto, currentUser);
  }

  @Get()
  @RequireRoles(Roles.DISPATCHER, Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'List trips with filters and pagination' })
  findAll(@Query() query: QueryTripsDto, @CurrentUser() currentUser: UserEntity) {
    return this.tripsService.findAll(query, currentUser);
  }

  @Get(':id')
  @RequireRoles(Roles.DISPATCHER, Roles.ACCOUNTANT, Roles.DRIVER, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Get trip detail' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: UserEntity) {
    return this.tripsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @RequireRoles(Roles.DISPATCHER, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Update a planned trip' })
  update(@Param('id') id: string, @Body() dto: UpdateTripDto, @CurrentUser() currentUser: UserEntity) {
    return this.tripsService.update(id, dto, currentUser);
  }

  @Patch(':id/assign-manifest')
  @RequireRoles(Roles.DISPATCHER, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Assign a closed manifest to a planned trip' })
  assignManifest(@Param('id') id: string, @Body() dto: AssignManifestDto, @CurrentUser() currentUser: UserEntity) {
    return this.tripsService.assignManifest(id, dto, currentUser);
  }

  @Patch(':id/start')
  @RequireRoles(Roles.DISPATCHER, Roles.DRIVER, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Start a planned trip' })
  startTrip(@Param('id') id: string, @Body() _dto: StartTripDto, @CurrentUser() currentUser: UserEntity) {
    return this.tripsService.startTrip(id, currentUser);
  }

  @Patch(':id/arrive')
  @RequireRoles(Roles.DISPATCHER, Roles.DRIVER, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Mark an in-transit trip as arrived' })
  arriveTrip(@Param('id') id: string, @Body() dto: ArriveTripDto, @CurrentUser() currentUser: UserEntity) {
    return this.tripsService.arriveTrip(id, dto, currentUser);
  }

  @Patch(':id/complete')
  @RequireRoles(Roles.DISPATCHER, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Complete an arrived trip' })
  completeTrip(@Param('id') id: string, @Body() _dto: CompleteTripDto, @CurrentUser() currentUser: UserEntity) {
    return this.tripsService.completeTrip(id, currentUser);
  }

  @Patch(':id/costs')
  @RequireRoles(Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Update trip costs' })
  updateCosts(@Param('id') id: string, @Body() dto: UpdateTripCostsDto, @CurrentUser() currentUser: UserEntity) {
    return this.tripsService.updateCosts(id, dto, currentUser);
  }

  @Get(':id/profit')
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Get provisional trip profit' })
  getTripProfit(@Param('id') id: string, @CurrentUser() currentUser: UserEntity) {
    return this.tripsService.getTripProfit(id, currentUser);
  }
}
