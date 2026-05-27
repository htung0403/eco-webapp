import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HubEntity } from '../hubs/hub.entity';
import { ManifestWaybillEntity } from '../manifests/manifest-waybill.entity';
import { ManifestEntity } from '../manifests/manifest.entity';
import { TruckEntity } from '../trucks/truck.entity';
import { WaybillEntity } from '../waybills/waybill.entity';
import { TripEntity } from './trip.entity';
import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';

@Module({
  imports: [TypeOrmModule.forFeature([TripEntity, TruckEntity, ManifestEntity, ManifestWaybillEntity, WaybillEntity, HubEntity])],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
