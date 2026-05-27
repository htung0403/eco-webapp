import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { WaybillPriority } from './waybill.enums';

export class AssignWaybillPriorityDto {
  @ApiProperty({ enum: WaybillPriority }) @IsEnum(WaybillPriority) priority: WaybillPriority;
  @ApiPropertyOptional() @IsOptional() @IsString() reason?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
