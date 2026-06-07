import { PartialType } from '@nestjs/swagger';
import { CreateFundBalanceDto } from './create-fund-balance.dto';

export class UpdateFundBalanceDto extends PartialType(CreateFundBalanceDto) {}
