import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripEntity } from '../trips/trip.entity';
import { UserHubEntity } from '../users/user-hub.entity';
import { UserEntity } from '../users/user.entity';
import { WaybillEntity } from '../waybills/waybill.entity';
import { HubEntity } from './hub.entity';
import { HubsController } from './hubs.controller';
import { HubsService } from './hubs.service';

@Module({
  imports: [TypeOrmModule.forFeature([HubEntity, WaybillEntity, TripEntity, UserEntity, UserHubEntity])],
  controllers: [HubsController],
  providers: [HubsService],
  exports: [HubsService],
})
export class HubsModule {}
