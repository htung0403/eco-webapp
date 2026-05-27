import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateManifestDto {
  @ApiProperty({ example: '1' })
  @IsString()
  @IsNotEmpty()
  origin_hub_id: string;

  @ApiProperty({ example: '2' })
  @IsString()
  @IsNotEmpty()
  dest_hub_id: string;

  @ApiPropertyOptional({ example: 'Giao tuyến HAN-HCM' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'SEAL001' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9._-]+$/)
  seal_code?: string;
}
