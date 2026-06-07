import { Type } from 'class-transformer';
import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateFundBalanceDto {
  @IsDateString()
  record_date: string;

  @IsString()
  @IsNotEmpty()
  fund_code: string;

  @IsString()
  @IsNotEmpty()
  fund_name: string;

  @IsOptional()
  @IsString()
  hub_name?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  balance_amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}
