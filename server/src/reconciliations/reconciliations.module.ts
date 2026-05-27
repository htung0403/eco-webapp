import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HubEntity } from '../hubs/hub.entity';
import { ReconciliationEntity } from './reconciliation.entity';
import { ReconciliationsController } from './reconciliations.controller';
import { ReconciliationsService } from './reconciliations.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReconciliationEntity, HubEntity])],
  controllers: [ReconciliationsController],
  providers: [ReconciliationsService],
  exports: [ReconciliationsService],
})
export class ReconciliationsModule {}
