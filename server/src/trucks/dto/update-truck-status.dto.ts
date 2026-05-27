import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TruckStatus } from './truck.enums';

export class UpdateTruckStatusDto {
  @ApiProperty({ enum: TruckStatus })
  @IsEnum(TruckStatus)
  status: TruckStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
