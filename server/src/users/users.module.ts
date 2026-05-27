import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HubEntity } from '../hubs/hub.entity';
import { ManifestEntity } from '../manifests/manifest.entity';
import { ReconciliationEntity } from '../reconciliations/reconciliation.entity';
import { TripEntity } from '../trips/trip.entity';
import { TruckEntity } from '../trucks/truck.entity';
import { WaybillEntity } from '../waybills/waybill.entity';
import { UserHubEntity } from './user-hub.entity';
import { UserEntity } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, UserHubEntity, HubEntity, TripEntity, TruckEntity, ManifestEntity, ReconciliationEntity, WaybillEntity])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
