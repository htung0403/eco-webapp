import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateWaybillCashVoucherDto {
  @ApiProperty({ enum: ['Thu', 'Chi'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['Thu', 'Chi'])
  voucher_type: 'Thu' | 'Chi';

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  note?: string;

  @ApiPropertyOptional({ description: 'URL or base64 data URL of attachment image' })
  @IsOptional()
  @IsString()
  @MaxLength(2_000_000)
  image_url?: string;
}
