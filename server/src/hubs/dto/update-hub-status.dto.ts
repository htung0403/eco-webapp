import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateHubStatusDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  is_active: boolean;
}
