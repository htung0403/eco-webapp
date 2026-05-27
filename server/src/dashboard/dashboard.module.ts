import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExpenseEntity } from '../expenses/expense.entity';
import { HubEntity } from '../hubs/hub.entity';
import { ManifestEntity } from '../manifests/manifest.entity';
import { ReconciliationEntity } from '../reconciliations/reconciliation.entity';
import { TripEntity } from '../trips/trip.entity';
import { TruckEntity } from '../trucks/truck.entity';
import { WaybillEntity } from '../waybills/waybill.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardKpiEntity } from './dashboard-kpi.entity';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [TypeOrmModule.forFeature([DashboardKpiEntity, WaybillEntity, TripEntity, ManifestEntity, HubEntity, TruckEntity, ReconciliationEntity, ExpenseEntity])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
