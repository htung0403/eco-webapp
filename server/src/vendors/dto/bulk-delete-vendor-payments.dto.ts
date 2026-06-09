import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class BulkDeleteVendorPaymentsDto {
  @ApiProperty({ type: [String], description: 'Danh sách id phiếu chi NCC cần xóa' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids: string[];
}
