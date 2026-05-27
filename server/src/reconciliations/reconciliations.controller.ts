import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireRoles } from '../auth/decorators/require-roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles';
import { UserEntity } from '../users/user.entity';
import { CreateReconciliationDto } from './dto/create-reconciliation.dto';
import { QueryReconciliationsDto } from './dto/query-reconciliations.dto';
import { RemitReconciliationDto } from './dto/remit-reconciliation.dto';
import { UpdateReconciliationDto } from './dto/update-reconciliation.dto';
import { ReconciliationsService } from './reconciliations.service';

@ApiTags('Reconciliations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reconciliations')
export class ReconciliationsController {
  constructor(private readonly reconciliationsService: ReconciliationsService) {}

  @Post()
  @RequireRoles(Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Create a hub reconciliation' })
  create(@Body() dto: CreateReconciliationDto, @CurrentUser() currentUser: UserEntity) {
    return this.reconciliationsService.create(dto, currentUser);
  }

  @Get()
  @RequireRoles(Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'List hub reconciliations' })
  findAll(@Query() query: QueryReconciliationsDto, @CurrentUser() currentUser: UserEntity) {
    return this.reconciliationsService.findAll(query, currentUser);
  }

  @Patch('mark-overdue')
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Mark overdue pending reconciliations' })
  markOverdue(@CurrentUser() currentUser: UserEntity) {
    return this.reconciliationsService.markOverdue(currentUser);
  }

  @Get('hub/:hubId/summary')
  @RequireRoles(Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Get reconciliation summary by hub' })
  getHubSummary(@Param('hubId') hubId: string, @CurrentUser() currentUser: UserEntity) {
    return this.reconciliationsService.getHubSummary(hubId, currentUser);
  }

  @Get(':id')
  @RequireRoles(Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Get reconciliation detail' })
  findOne(@Param('id') id: string, @CurrentUser() currentUser: UserEntity) {
    return this.reconciliationsService.findOne(id, currentUser);
  }

  @Patch(':id')
  @RequireRoles(Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Update a pending reconciliation' })
  update(@Param('id') id: string, @Body() dto: UpdateReconciliationDto, @CurrentUser() currentUser: UserEntity) {
    return this.reconciliationsService.update(id, dto, currentUser);
  }

  @Put(':id/remit')
  @RequireRoles(Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Mark a reconciliation as remitted' })
  remit(@Param('id') id: string, @Body() dto: RemitReconciliationDto, @CurrentUser() currentUser: UserEntity) {
    return this.reconciliationsService.remit(id, dto, currentUser);
  }

  @Delete(':id')
  @RequireRoles(Roles.DIRECTOR)
  @ApiOperation({ summary: 'Delete a non-remitted reconciliation' })
  remove(@Param('id') id: string, @CurrentUser() currentUser: UserEntity) {
    return this.reconciliationsService.remove(id, currentUser);
  }
}
