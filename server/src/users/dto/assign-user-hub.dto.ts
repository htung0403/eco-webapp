import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class AssignUserHubDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  @IsString()
  hub_id?: string | null;
}
