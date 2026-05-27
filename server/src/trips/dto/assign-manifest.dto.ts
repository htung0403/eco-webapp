import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class AssignManifestDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  manifest_id: number;
}
