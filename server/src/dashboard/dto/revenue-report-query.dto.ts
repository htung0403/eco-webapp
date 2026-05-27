import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { QueryDashboardDto } from './query-dashboard.dto';

export enum RevenueGroupBy {
  DAY = 'day',
  HUB = 'hub',
  PAYMENT_TYPE = 'payment_type',
}

export class RevenueReportQueryDto extends QueryDashboardDto {
  @ApiPropertyOptional({ enum: RevenueGroupBy, default: RevenueGroupBy.DAY })
  @IsOptional()
  @IsEnum(RevenueGroupBy)
  group_by?: RevenueGroupBy = RevenueGroupBy.DAY;
}
