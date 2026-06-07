import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainCrudService } from '../common/domain-crud.service';
import { CreateFundBalanceDto } from './dto/create-fund-balance.dto';
import { UpdateFundBalanceDto } from './dto/update-fund-balance.dto';
import { FundBalanceEntity } from './fund-balance.entity';

@Injectable()
export class FundBalanceService extends DomainCrudService<FundBalanceEntity, CreateFundBalanceDto, UpdateFundBalanceDto, FundBalanceEntity> {
  constructor(@InjectRepository(FundBalanceEntity) private readonly fundBalanceRepository: Repository<FundBalanceEntity>) {
    super(fundBalanceRepository, {
      alias: 'fundBalance',
      searchColumns: ['fund_code', 'fund_name', 'hub_name', 'note'],
      uniqueColumns: [],
      nullableStrings: ['hub_name', 'note'],
    });
  }
}
