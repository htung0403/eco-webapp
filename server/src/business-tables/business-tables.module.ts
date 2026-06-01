import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { businessTableEntities } from './business-table.entities';
import { businessTableControllers } from './business-tables.controllers';
import { BusinessTablesService } from './business-tables.service';

@Module({
  imports: [TypeOrmModule.forFeature(businessTableEntities)],
  controllers: businessTableControllers,
  providers: [BusinessTablesService],
})
export class BusinessTablesModule {}
