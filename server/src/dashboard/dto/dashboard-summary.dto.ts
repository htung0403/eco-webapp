import { ApiProperty } from '@nestjs/swagger';

export class DashboardSummaryDto {
  @ApiProperty() total_waybills: number;
  @ApiProperty() total_trips: number;
  @ApiProperty() total_manifests: number;
  @ApiProperty() delivered_waybills: number;
  @ApiProperty() returned_waybills: number;
  @ApiProperty() overdue_waybills: number;
  @ApiProperty() in_transit_waybills: number;
  @ApiProperty() pending_cod_amount: number;
  @ApiProperty({ required: false }) total_revenue?: number;
  @ApiProperty({ required: false }) total_cost?: number;
  @ApiProperty({ required: false }) estimated_profit?: number;
}
