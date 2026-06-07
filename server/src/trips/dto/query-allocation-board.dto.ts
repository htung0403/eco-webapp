import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class QueryAllocationBoardDto {
  @ApiPropertyOptional({ description: 'Filter trips by destination hub' })
  @IsOptional()
  @IsString()
  end_hub_id?: string;

  @ApiPropertyOptional({ description: 'Highlight waybill on the board' })
  @IsOptional()
  @IsString()
  waybill_id?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  limit?: number;
}
