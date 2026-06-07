import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { normalizePaginationLimit } from '../../common/pagination';

export class QueryLoadPlanningBoardDto {
  @ApiPropertyOptional({ description: 'Search waybill code, sender, receiver' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: 'Comma-separated origin hub ids' })
  @IsOptional()
  @IsString()
  origin_hub_id?: string;

  @ApiPropertyOptional({ description: 'Comma-separated destination hub ids' })
  @IsOptional()
  @IsString()
  dest_hub_id?: string;

  @ApiPropertyOptional({ description: 'Comma-separated truck ids' })
  @IsOptional()
  @IsString()
  truck_id?: string;

  @ApiPropertyOptional({ description: 'Filter by company name (ten_cty / ma_kh / sender)' })
  @IsOptional()
  @IsString()
  ten_cty?: string;

  @ApiPropertyOptional({ description: 'Filter by vendor id (NCC trucks/trips)' })
  @IsOptional()
  @IsString()
  vendor_id?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Transform(normalizePaginationLimit)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
