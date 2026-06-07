import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryWaybillCashVouchersDto {
  @ApiPropertyOptional({ description: 'Customer code (ma_kh)' })
  @IsOptional()
  @IsString()
  ma_kh?: string;

  @ApiPropertyOptional({ description: 'Search bill code, ma_kh, note' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  from_date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  to_date?: string;

  @ApiPropertyOptional({ enum: ['Thu', 'Chi'] })
  @IsOptional()
  @IsString()
  @IsIn(['Thu', 'Chi'])
  voucher_type?: 'Thu' | 'Chi';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 100;
}
