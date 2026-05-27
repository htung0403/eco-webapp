import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateWaybillDto } from './create-waybill.dto';

export class UpdateWaybillDto extends PartialType(OmitType(CreateWaybillDto, ['cod_amount', 'freight_amount', 'cc_amount'] as const)) {}
