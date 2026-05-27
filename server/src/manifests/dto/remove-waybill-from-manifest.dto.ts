import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RemoveWaybillFromManifestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
