import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RequireRoles } from '../auth/decorators/require-roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/roles';
import { UserEntity } from '../users/user.entity';
import { DashboardService } from './dashboard.service';
import { QueryDashboardDto } from './dto/query-dashboard.dto';
import { QueryOverdueDto } from './dto/query-overdue.dto';
import { RevenueReportQueryDto } from './dto/revenue-report-query.dto';

@ApiTags('Dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('kpi')
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Get executive KPI summary' })
  getKpiSummary(@Query() query: QueryDashboardDto, @CurrentUser() currentUser: UserEntity) {
    return this.dashboardService.getKpiSummary(query, currentUser);
  }

  @Get('overdue')
  @RequireRoles(Roles.DISPATCHER, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Get overdue waybills by SLA aging' })
  getOverdueWaybills(@Query() query: QueryOverdueDto, @CurrentUser() currentUser: UserEntity) {
    return this.dashboardService.getOverdueWaybills(query, currentUser);
  }

  @Get('revenue')
  @RequireRoles(Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Get revenue report grouped by date, hub, or payment type' })
  getRevenueReport(@Query() query: RevenueReportQueryDto, @CurrentUser() currentUser: UserEntity) {
    return this.dashboardService.getRevenueReport(query, currentUser);
  }

  @Get('waybill-status')
  @RequireRoles(Roles.DISPATCHER, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Get waybill status statistics' })
  getWaybillStatusStats(@Query() query: QueryDashboardDto, @CurrentUser() currentUser: UserEntity) {
    return this.dashboardService.getWaybillStatusStats(query, currentUser);
  }

  @Get('trip-status')
  @RequireRoles(Roles.DISPATCHER, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Get trip status statistics' })
  getTripStatusStats(@Query() query: QueryDashboardDto, @CurrentUser() currentUser: UserEntity) {
    return this.dashboardService.getTripStatusStats(query, currentUser);
  }

  @Get('hub-performance')
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Get hub performance statistics' })
  getHubPerformance(@Query() query: QueryDashboardDto, @CurrentUser() currentUser: UserEntity) {
    return this.dashboardService.getHubPerformance(query, currentUser);
  }

  @Get('finance-summary')
  @RequireRoles(Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR)
  @ApiOperation({ summary: 'Get finance summary for COD, CC, remittance, and trip costs' })
  getFinanceSummary(@Query() query: QueryDashboardDto, @CurrentUser() currentUser: UserEntity) {
    return this.dashboardService.getFinanceSummary(query, currentUser);
  }
}
