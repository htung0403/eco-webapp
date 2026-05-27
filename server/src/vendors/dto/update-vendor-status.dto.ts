import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateVendorStatusDto {
  @ApiProperty({ example: 'ACTIVE' })
  @IsString()
  @IsNotEmpty()
  status: string;
}
