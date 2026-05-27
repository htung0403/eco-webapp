import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsString, Min } from 'class-validator';

export class CreateReconciliationDto {
  @ApiProperty()
  @IsString()
  hub_id: string;

  @ApiProperty({ type: String, format: 'date' })
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
