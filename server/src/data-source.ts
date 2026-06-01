import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { businessTableEntities } from './business-tables/business-table.entities';
import { getDatabaseUrl } from './database-url';
import { ExpenseEntity } from './expenses/expense.entity';
import { HubEntity } from './hubs/hub.entity';
import { ManifestEntity } from './manifests/manifest.entity';
import { ManifestWaybillEntity } from './manifests/manifest-waybill.entity';
import { ReconciliationEntity } from './reconciliations/reconciliation.entity';
import { TripEntity } from './trips/trip.entity';
import { TruckEntity } from './trucks/truck.entity';
import { UserEntity } from './users/user.entity';
import { UserHubEntity } from './users/user-hub.entity';
import { WaybillEntity } from './waybills/waybill.entity';

export default new DataSource({
  type: 'postgres',
  url: getDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
  entities: [
    HubEntity,
    UserEntity,
    UserHubEntity,
    WaybillEntity,
    ManifestEntity,
    ManifestWaybillEntity,
    TruckEntity,
    TripEntity,
    ExpenseEntity,
    ReconciliationEntity,
    ...businessTableEntities,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});

