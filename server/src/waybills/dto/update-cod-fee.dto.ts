import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateCodFeeDto {
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) cod_amount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) freight_amount?: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) cc_amount?: number;
}
