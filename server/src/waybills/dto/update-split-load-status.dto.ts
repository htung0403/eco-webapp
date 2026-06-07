import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { WaybillSplitLoadStatus } from './waybill-split-load-status.enum';

export class UpdateSplitLoadStatusDto {
  @ApiProperty({ enum: WaybillSplitLoadStatus })
  @IsEnum(WaybillSplitLoadStatus)
  load_status: WaybillSplitLoadStatus;
}
