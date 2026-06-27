import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsInt, IsNumber, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';
import { VendorTripPaymentStatus } from '../../common/enums';

export class BulkUpdateTripVendorPaymentDto {
  @ApiProperty({ type: [Number] })
  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsInt({ each: true })
  trip_ids!: number[];

  @ApiProperty({ enum: VendorTripPaymentStatus })
  @IsEnum(VendorTripPaymentStatus)
  payment_status!: VendorTripPaymentStatus;

  @ApiPropertyOptional({ description: 'Số tiền đã chi (VNĐ) — bắt buộc khi PAID; tùy chọn khi PARTIAL' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  paid_amount?: number;

  @ApiPropertyOptional({ description: 'URL ảnh chứng từ — bắt buộc khi PAID' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @IsUrl({ require_protocol: true })
  proof_image_url?: string;

  @ApiPropertyOptional({ description: 'Ghi chú thanh toán NCC (vd: đã CK ngày ...)' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  payment_note?: string;
}
