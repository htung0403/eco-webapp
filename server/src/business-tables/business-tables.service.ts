import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Brackets, Repository } from 'typeorm';
import {
  CarrierDirectoryEntity,
  CashJournalEntryEntity,
  CashTransactionDetailEntity,
  ChanhShipmentEntity,
  CustomerDirectoryEntity,
  NorthSouthShipmentEntity,
  StaffMemberEntity,
  VehicleCostEntity,
  VehicleDirectoryEntity,
  WarehouseEntity,
} from './business-table.entities';

type BusinessResource =
  | 'vehicleDirectory'
  | 'vehicleCosts'
  | 'cashTransactionDetails'
  | 'northSouthShipments'
  | 'staffMembers'
  | 'carrierDirectory'
  | 'chanhShipments'
  | 'customerDirectory'
  | 'cashJournalEntries'
  | 'warehouses';

interface BusinessResourceConfig {
  repo: Repository<any>;
  alias: string;
  required: string[];
  search: string[];
  numeric?: string[];
  integer?: string[];
  date?: string[];
  time?: string[];
  unique?: string[];
  nullable?: string[];
  password?: boolean;
}

interface QueryBusinessDto {
  page?: number;
  limit?: number;
  q?: string;
}

@Injectable()
export class BusinessTablesService {
  private readonly saltRounds = 10;

  constructor(
    @InjectRepository(VehicleDirectoryEntity) private readonly vehicleDirectoryRepository: Repository<VehicleDirectoryEntity>,
    @InjectRepository(VehicleCostEntity) private readonly vehicleCostsRepository: Repository<VehicleCostEntity>,
    @InjectRepository(CashTransactionDetailEntity) private readonly cashTransactionDetailsRepository: Repository<CashTransactionDetailEntity>,
    @InjectRepository(NorthSouthShipmentEntity) private readonly northSouthShipmentsRepository: Repository<NorthSouthShipmentEntity>,
    @InjectRepository(StaffMemberEntity) private readonly staffMembersRepository: Repository<StaffMemberEntity>,
    @InjectRepository(CarrierDirectoryEntity) private readonly carrierDirectoryRepository: Repository<CarrierDirectoryEntity>,
    @InjectRepository(ChanhShipmentEntity) private readonly chanhShipmentsRepository: Repository<ChanhShipmentEntity>,
    @InjectRepository(CustomerDirectoryEntity) private readonly customerDirectoryRepository: Repository<CustomerDirectoryEntity>,
    @InjectRepository(CashJournalEntryEntity) private readonly cashJournalEntriesRepository: Repository<CashJournalEntryEntity>,
    @InjectRepository(WarehouseEntity) private readonly warehousesRepository: Repository<WarehouseEntity>,
  ) {}

  async list(resource: BusinessResource, query: QueryBusinessDto) {
    const config = this.getConfig(resource);
    const page = this.toPositiveInt(query.page, 1, 1, 100000);
    const limit = this.toPositiveInt(query.limit, 20, 1, 100);
    const qb = config.repo.createQueryBuilder(config.alias).orderBy(`${config.alias}.created_at`, 'DESC').skip((page - 1) * limit).take(limit);

    if (query.q?.trim()) {
      const keyword = `%${query.q.trim()}%`;
      qb.andWhere(
        new Brackets((builder) => {
          config.search.forEach((column, index) => {
            const clause = `${config.alias}.${column} ILIKE :keyword`;
            if (index === 0) builder.where(clause, { keyword });
            else builder.orWhere(clause, { keyword });
          });
        }),
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return { data: data.map((item) => this.toSafe(item)), total, page, limit };
  }

  async findOne(resource: BusinessResource, id: string) {
    const entity = await this.getConfig(resource).repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Record not found');
    return this.toSafe(entity);
  }

  async create(resource: BusinessResource, body: Record<string, unknown>) {
    const config = this.getConfig(resource);
    const payload = await this.buildPayload(config, body, true);
    await this.assertUnique(config, payload);
    const entity = config.repo.create(payload);
    return this.toSafe(await config.repo.save(entity));
  }

  async update(resource: BusinessResource, id: string, body: Record<string, unknown>) {
    const config = this.getConfig(resource);
    const entity = await config.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Record not found');
    const payload = await this.buildPayload(config, body, false);
    await this.assertUnique(config, payload, id);
    Object.assign(entity, payload);
    return this.toSafe(await config.repo.save(entity));
  }

  async remove(resource: BusinessResource, id: string) {
    const entity = await this.getConfig(resource).repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Record not found');
    await this.getConfig(resource).repo.delete(id);
  }

  private async buildPayload(config: BusinessResourceConfig, body: Record<string, unknown>, isCreate: boolean) {
    const allowed = new Set([...config.required, ...config.search, ...(config.numeric ?? []), ...(config.integer ?? []), ...(config.date ?? []), ...(config.time ?? []), ...(config.nullable ?? []), ...(config.unique ?? []), 'password']);
    const payload: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(body ?? {})) {
      if (!allowed.has(key)) continue;
      if (key === 'password') continue;
      payload[key] = typeof value === 'string' ? value.trim() : value;
    }

    if (config.password) {
      const password = typeof body.password === 'string' ? body.password.trim() : '';
      if (password) payload.password_hash = await bcrypt.hash(password, this.saltRounds);
      else if (isCreate) throw new BadRequestException('password is required');
    }

    for (const field of config.required) {
      if (!isCreate && payload[field] === undefined) continue;
      if (payload[field] === undefined || payload[field] === null || `${payload[field]}`.trim() === '') throw new BadRequestException(`${field} is required`);
    }

    for (const field of config.numeric ?? []) {
      if (payload[field] === undefined || payload[field] === null || payload[field] === '') continue;
      const value = Number(payload[field]);
      if (!Number.isFinite(value) || value < 0) throw new BadRequestException(`${field} must be a non-negative number`);
      payload[field] = value;
    }

    for (const field of config.integer ?? []) {
      if (payload[field] === undefined || payload[field] === null || payload[field] === '') continue;
      const value = Number(payload[field]);
      if (!Number.isInteger(value) || value < 0) throw new BadRequestException(`${field} must be a non-negative integer`);
      payload[field] = value;
    }

    for (const field of config.date ?? []) {
      if (payload[field] === undefined || !Number.isNaN(Date.parse(`${payload[field]}`))) continue;
      throw new BadRequestException(`${field} must be an ISO date`);
    }

    for (const field of config.time ?? []) {
      if (payload[field] === undefined || /^\d{2}:\d{2}(:\d{2})?$/.test(`${payload[field]}`)) continue;
      throw new BadRequestException(`${field} must use HH:mm format`);
    }

    return payload;
  }

  private async assertUnique(config: BusinessResourceConfig, payload: Record<string, unknown>, ignoreId?: string) {
    for (const field of config.unique ?? []) {
      if (!payload[field]) continue;
      const qb = config.repo.createQueryBuilder(config.alias).where(`${config.alias}.${field} = :value`, { value: payload[field] });
      if (ignoreId) qb.andWhere(`${config.alias}.id != :ignoreId`, { ignoreId });
      if (await qb.getOne()) throw new ConflictException(`${field} already exists`);
    }
  }

  private toSafe(entity: any) {
    if (!entity) return entity;
    const { password_hash: _passwordHash, ...safe } = entity;
    return safe;
  }

  private toPositiveInt(value: unknown, fallback: number, min: number, max: number) {
    const parsed = Number(value ?? fallback);
    if (!Number.isInteger(parsed)) return fallback;
    return Math.min(Math.max(parsed, min), max);
  }

  private getConfig(resource: BusinessResource): BusinessResourceConfig {
    const configs: Record<BusinessResource, BusinessResourceConfig> = {
      vehicleDirectory: { repo: this.vehicleDirectoryRepository, alias: 'vehicle', required: ['driver_name', 'region', 'carrier_name', 'license_plate', 'vehicle_type'], search: ['driver_name', 'region', 'carrier_name', 'license_plate', 'vehicle_type'], unique: ['license_plate'] },
      vehicleCosts: { repo: this.vehicleCostsRepository, alias: 'cost', required: ['cost_date', 'license_plate', 'vehicle_type', 'cost_type', 'amount', 'status'], search: ['license_plate', 'vehicle_type', 'cost_type', 'status'], numeric: ['amount'], date: ['cost_date'] },
      cashTransactionDetails: { repo: this.cashTransactionDetailsRepository, alias: 'detail', required: ['vehicle_cost_id', 'voucher_type', 'voucher_name', 'service_type', 'counterparty_unit', 'content', 'performed_by', 'entry_date', 'entry_time', 'amount'], search: ['voucher_type', 'voucher_name', 'service_type', 'counterparty_unit', 'content', 'performed_by', 'note'], numeric: ['amount'], date: ['entry_date'], time: ['entry_time'], nullable: ['note'] },
      northSouthShipments: { repo: this.northSouthShipmentsRepository, alias: 'shipment', required: ['bill', 'goods_name', 'package_count', 'volume', 'weight', 'service_type', 'destination', 'address', 'unit', 'unit_price', 'transfer_fee', 'total_amount', 'cod_amount', 'payment_method', 'external_vehicle_cost', 'customer_discount', 'final_profit', 'carrier_holding_amount'], search: ['bill', 'goods_name', 'service_type', 'destination', 'address', 'unit', 'payment_method', 'note', 'pickup_vehicle_status', 'external_vehicle_payment_method'], numeric: ['volume', 'weight', 'unit_price', 'transfer_fee', 'total_amount', 'cod_amount', 'external_vehicle_cost', 'customer_discount', 'final_profit', 'carrier_holding_amount'], integer: ['package_count'], nullable: ['note', 'pickup_vehicle_status', 'external_vehicle_payment_method'] },
      staffMembers: { repo: this.staffMembersRepository, alias: 'staff', required: ['full_name', 'department', 'position', 'phone'], search: ['full_name', 'department', 'position', 'phone'], unique: ['phone'], password: true },
      carrierDirectory: { repo: this.carrierDirectoryRepository, alias: 'carrier', required: ['region', 'carrier_name', 'license_plate'], search: ['region', 'carrier_name', 'license_plate'] },
      chanhShipments: { repo: this.chanhShipmentsRepository, alias: 'chanh', required: ['province_code', 'bill_count', 'company_name', 'goods_name', 'quantity', 'goods_type', 'unit_price', 'cost_type', 'carrier_name', 'license_plate', 'shipment_date', 'bo_fee', 'bill'], search: ['province_code', 'company_name', 'goods_name', 'goods_type', 'cost_type', 'note', 'carrier_name', 'license_plate', 'bill'], numeric: ['quantity', 'unit_price', 'bo_fee'], integer: ['bill_count'], date: ['shipment_date'], nullable: ['note'] },
      customerDirectory: { repo: this.customerDirectoryRepository, alias: 'customer', required: ['full_name', 'phone', 'address', 'customer_code'], search: ['full_name', 'phone', 'address', 'customer_code'], unique: ['customer_code'] },
      cashJournalEntries: { repo: this.cashJournalEntriesRepository, alias: 'journal', required: ['entry_date', 'voucher_type', 'source', 'cost_category', 'detail', 'content', 'income_amount', 'expense_amount'], search: ['voucher_type', 'source', 'cost_category', 'detail', 'note', 'content'], numeric: ['income_amount', 'expense_amount'], date: ['entry_date'], nullable: ['note'] },
      warehouses: { repo: this.warehousesRepository, alias: 'warehouse', required: ['warehouse_name'], search: ['warehouse_name'] },
    };

    return configs[resource];
  }
}

export type { BusinessResource, QueryBusinessDto };
