import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class PrintManifestDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  include_cod_total?: boolean = true;
}
