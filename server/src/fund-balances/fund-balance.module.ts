import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FundBalanceController } from './fund-balance.controller';
import { FundBalanceEntity } from './fund-balance.entity';
import { FundBalanceService } from './fund-balance.service';

@Module({
  imports: [TypeOrmModule.forFeature([FundBalanceEntity])],
  controllers: [FundBalanceController],
  providers: [FundBalanceService],
  exports: [FundBalanceService],
})
export class FundBalanceModule {}
