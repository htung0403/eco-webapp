import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HubEntity } from '../hubs/hub.entity';
import { TripEntity } from '../trips/trip.entity';
import { UserEntity } from '../users/user.entity';
import { TruckEntity } from './truck.entity';
import { TrucksController } from './trucks.controller';
import { TrucksService } from './trucks.service';

@Module({
  imports: [TypeOrmModule.forFeature([TruckEntity, UserEntity, HubEntity, TripEntity])],
  controllers: [TrucksController],
  providers: [TrucksService],
  exports: [TrucksService],
})
export class TrucksModule {}
