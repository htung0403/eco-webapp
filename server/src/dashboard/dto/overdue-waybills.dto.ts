import { ApiProperty } from '@nestjs/swagger';

export class OverdueWaybillDto {
  @ApiProperty() id: string;
  @ApiProperty() waybill_code: string;
  @ApiProperty() status: string;
  @ApiProperty() hub: string;
  @ApiProperty() receiver_info: string;
  @ApiProperty() overdue_hours: number;
  @ApiProperty() priority: string;
}
