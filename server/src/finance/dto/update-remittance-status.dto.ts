import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { RemittanceStatus } from '../../common/enums';

export class UpdateRemittanceStatusDto {
  @ApiProperty({ enum: RemittanceStatus })
  @IsEnum(RemittanceStatus)
  remittance_status: RemittanceStatus;
}
