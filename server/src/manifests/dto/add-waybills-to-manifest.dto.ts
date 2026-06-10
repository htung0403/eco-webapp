import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class AddWaybillManifestItemDto {
  @ApiProperty({ example: '100' })
  @IsString()
  waybill_id: string;

  @ApiProperty({ example: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  package_count: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  loading_position?: number;
}

export class AddWaybillsToManifestDto {
  @ApiPropertyOptional({ type: [AddWaybillManifestItemDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AddWaybillManifestItemDto)
  items?: AddWaybillManifestItemDto[];

  @ApiPropertyOptional({ example: ['1', '2'] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  waybill_ids?: string[];
}
