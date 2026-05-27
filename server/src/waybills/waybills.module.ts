import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HubEntity } from '../hubs/hub.entity';
import { WaybillEntity } from './waybill.entity';
import { WaybillsController } from './waybills.controller';
import { WaybillsService } from './waybills.service';

@Module({
  imports: [TypeOrmModule.forFeature([WaybillEntity, HubEntity])],
  controllers: [WaybillsController],
  providers: [WaybillsService],
  exports: [WaybillsService],
})
export class WaybillsModule {}
