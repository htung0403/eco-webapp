import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TripStatus, WaybillState } from '../../common/enums';

export enum GlobalSearchType {
  ALL = 'ALL',
  WAYBILL = 'WAYBILL',
  TRIP = 'TRIP',
}

export class GlobalSearchDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ enum: GlobalSearchType, default: GlobalSearchType.ALL })
  @IsOptional()
  @IsEnum(GlobalSearchType)
  type?: GlobalSearchType = GlobalSearchType.ALL;

  @ApiPropertyOptional({ description: 'Waybill or trip status' })
  @IsOptional()
  @IsString()
  status?: WaybillState | TripStatus | string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date_from?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date_to?: Date;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
