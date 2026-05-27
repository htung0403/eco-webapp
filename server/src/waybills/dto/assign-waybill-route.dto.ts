import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignWaybillRouteDto {
  @ApiProperty() @IsString() @IsNotEmpty() route_code: string;
  @ApiPropertyOptional() @IsOptional() @IsString() note?: string;
}
