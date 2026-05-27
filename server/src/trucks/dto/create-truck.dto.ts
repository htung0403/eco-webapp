import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { TruckStatus } from './truck.enums';

export class CreateTruckDto {
  @ApiProperty({ example: '29H-12345' })
  @IsString()
  @IsNotEmpty()
  license_plate: string;

  @ApiProperty({ example: 2500 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  payload: number;

  @ApiPropertyOptional({ example: '12' })
  @IsOptional()
  @IsString()
  driver_id?: string;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fuel_consumption_limit?: number = 0;

  @ApiPropertyOptional({ enum: TruckStatus, default: TruckStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(TruckStatus)
  status?: TruckStatus = TruckStatus.AVAILABLE;
}
