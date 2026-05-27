import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CloseManifestDto {
  @ApiProperty({ example: 'SEAL001' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9._-]+$/)
  seal_code: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  note?: string;
}
