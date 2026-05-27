import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class AddWaybillsToManifestDto {
  @ApiProperty({ example: ['1', '2'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  waybill_ids: string[];
}
