import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNumber, Min } from 'class-validator';

export class CreateReconciliationDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  hub_id: number;

  @ApiProperty({ example: '2026-05-26' })
  @IsDateString()
  reconciliation_date: string;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cod_cash_held: number;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cc_cash_held: number;

  @ApiProperty({ minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  total_remitted: number;
}
