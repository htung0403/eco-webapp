import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateManifestDto {
  @ApiPropertyOptional({ example: '2' })
  @IsOptional()
  @IsString()
  dest_hub_id?: string;

  @ApiPropertyOptional({ example: 'Ghi chú cập nhật' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: 'SEAL002' })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9._-]+$/)
  seal_code?: string;
}
