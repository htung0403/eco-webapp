import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { PaymentType, RemittanceStatus } from '../common/enums';
import { Roles, hasRole, isManager } from '../common/roles';
import { HubEntity } from '../hubs/hub.entity';
import { TripEntity } from '../trips/trip.entity';
import { UserEntity } from '../users/user.entity';
import { WaybillEntity } from '../waybills/waybill.entity';
import { ApproveInternalCostDto } from './dto/approve-internal-cost.dto';
import { ApproveVendorCostDto } from './dto/approve-vendor-cost.dto';
import { CodReconciliationQueryDto } from './dto/cod-reconciliation-query.dto';
import { CreateReconciliationDto } from './dto/create-reconciliation.dto';
import { HubReconciliationQueryDto } from './dto/hub-reconciliation-query.dto';
import { QueryReconciliationsDto } from './dto/query-reconciliations.dto';
import { UpdateReconciliationDto } from './dto/update-reconciliation.dto';
import { UpdateRemittanceStatusDto } from './dto/update-remittance-status.dto';
import { FinanceReconciliationEntity } from './reconciliation.entity';

type Scope = { hubId?: string; canViewSystem: boolean; canViewProfit: boolean };
type Paginated<T> = { items: T[]; meta: { total: number; page: number; limit: number; total_pages: number } };
type RawFinance = { hub_id?: string; reconciliation_date?: string; remittance_status?: string; cod?: string; cc?: string; remitted?: string; total?: string; amount?: string; remaining?: string };

@Injectable()
export class FinanceService {
  constructor(
    @InjectRepository(FinanceReconciliationEntity) private readonly reconciliationsRepository: Repository<FinanceReconciliationEntity>,
    @InjectRepository(HubEntity) private readonly hubsRepository: Repository<HubEntity>,
    @InjectRepository(TripEntity) private readonly tripsRepository: Repository<TripEntity>,
    @InjectRepository(WaybillEntity) private readonly waybillsRepository: Repository<WaybillEntity>,
  ) {}

  async createReconciliation(dto: CreateReconciliationDto, currentUser: UserEntity): Promise<Record<string, unknown>> {
    this.assertFinanceRole(currentUser);
    this.assertNonNegative(dto.cod_cash_held, dto.cc_cash_held, dto.total_remitted);
    this.validateReconciliationDate(dto.reconciliation_date);
    await this.assertHubExists(dto.hub_id, true);
    this.assertHubAccess(dto.hub_id, currentUser);
    const duplicate = await this.reconciliationsRepository.findOne({ where: { hub_id: dto.hub_id, reconciliation_date: dto.reconciliation_date } });
    if (duplicate) throw new ConflictException('Reconciliation already exists for hub and date');
    const reconciliation = this.reconciliationsRepository.create({
      hub_id: dto.hub_id,
      reconciliation_date: dto.reconciliation_date,
      cod_cash_held: String(dto.cod_cash_held),
      cc_cash_held: String(dto.cc_cash_held),
      total_remitted: String(dto.total_remitted),
      remittance_status: this.resolveRemittanceStatus(dto.cod_cash_held, dto.cc_cash_held, dto.total_remitted),
    });
    return this.sanitizeReconciliation(await this.reconciliationsRepository.save(reconciliation), currentUser);
  }

  async findReconciliations(query: QueryReconciliationsDto, currentUser: UserEntity): Promise<Paginated<Record<string, unknown>>> {
    this.assertFinanceRole(currentUser);
    const normalized = await this.normalizeQuery(query, currentUser);
    const page = normalized.page ?? 1;
    const limit = this.resolveLimit(normalized.limit);
    const qb = this.buildReconciliationQuery(normalized, currentUser)
      .leftJoinAndSelect('reconciliation.hub', 'hub')
      .select(['reconciliation.id', 'reconciliation.hub_id', 'reconciliation.reconciliation_date', 'reconciliation.cod_cash_held', 'reconciliation.cc_cash_held', 'reconciliation.total_remitted', 'reconciliation.remittance_status', 'reconciliation.remitted_at', 'hub.id', 'hub.code', 'hub.name'])
      .orderBy('reconciliation.reconciliation_date', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    const [items, total] = await qb.getManyAndCount();
    return this.paginate(items.map((item) => this.sanitizeReconciliation(item, currentUser)), total, page, limit);
  }

  async findReconciliationById(id: string, currentUser: UserEntity): Promise<Record<string, unknown>> {
    this.assertFinanceRole(currentUser);
    const qb = this.reconciliationsRepository.createQueryBuilder('reconciliation')
      .leftJoinAndSelect('reconciliation.hub', 'hub')
      .where('reconciliation.id = :id', { id });
    this.applyReconciliationScope(qb, currentUser);
    const reconciliation = await qb.getOne();
    if (!reconciliation) throw new NotFoundException('Reconciliation not found');
    return this.sanitizeReconciliation(reconciliation, currentUser);
  }

  async updateReconciliation(id: string, dto: UpdateReconciliationDto, currentUser: UserEntity): Promise<Record<string, unknown>> {
    this.assertFinanceRole(currentUser);
    this.assertNonNegative(dto.cod_cash_held, dto.cc_cash_held, dto.total_remitted);
    const reconciliation = await this.getMutableReconciliation(id, currentUser);
    if (dto.cod_cash_held !== undefined) reconciliation.cod_cash_held = String(dto.cod_cash_held);
    if (dto.cc_cash_held !== undefined) reconciliation.cc_cash_held = String(dto.cc_cash_held);
    if (dto.total_remitted !== undefined) reconciliation.total_remitted = String(dto.total_remitted);
    reconciliation.remittance_status = this.resolveRemittanceStatus(Number(reconciliation.cod_cash_held), Number(reconciliation.cc_cash_held), Number(reconciliation.total_remitted), reconciliation.remittance_status);
    return this.sanitizeReconciliation(await this.reconciliationsRepository.save(reconciliation), currentUser);
  }

  async updateRemittanceStatus(id: string, dto: UpdateRemittanceStatusDto, currentUser: UserEntity): Promise<Record<string, unknown>> {
    this.assertFinanceRole(currentUser);
    if (!Object.values(RemittanceStatus).includes(dto.remittance_status)) throw new BadRequestException('Invalid remittance status');
    const reconciliation = await this.getScopedReconciliation(id, currentUser);
    if (dto.remittance_status === RemittanceStatus.REMITTED && Number(reconciliation.total_remitted) < Number(reconciliation.cod_cash_held) + Number(reconciliation.cc_cash_held)) {
      throw new BadRequestException('Total remitted is lower than cash held');
    }
    reconciliation.remittance_status = dto.remittance_status;
    return this.sanitizeReconciliation(await this.reconciliationsRepository.save(reconciliation), currentUser);
  }

  async getCodReconciliation(query: CodReconciliationQueryDto, currentUser: UserEntity): Promise<Paginated<Record<string, unknown>>> {
    this.assertFinanceRole(currentUser);
    const normalized = await this.normalizeQuery(query, currentUser);
    const page = normalized.page ?? 1;
    const limit = this.resolveLimit(normalized.limit);
    const qb = this.waybillsRepository.createQueryBuilder('waybill')
      .select('COALESCE(waybill.current_hub_id, waybill.dest_hub_id, waybill.origin_hub_id)', 'hub_id')
      .addSelect('DATE(waybill.created_at)', 'reconciliation_date')
      .addSelect('waybill.current_state', 'remittance_status')
      .addSelect('COALESCE(SUM(waybill.cost_amount), 0)', 'amount')
      .addSelect('COUNT(*)', 'total')
      .where('waybill.payment_type = :paymentType', { paymentType: PaymentType.COD })
      .groupBy('hub_id')
      .addGroupBy('reconciliation_date')
      .addGroupBy('waybill.current_state')
      .orderBy('reconciliation_date', 'DESC');
    this.applyDateRangeToWaybill(qb, normalized);
    this.applyWaybillScope(qb, normalized.hub_id, currentUser);
    const allRows = await qb.clone().getRawMany<RawFinance>();
    const rows = await qb.offset((page - 1) * limit).limit(limit).getRawMany<RawFinance>();
    return this.paginate(rows.map((row) => ({ hub_id: row.hub_id, reconciliation_date: row.reconciliation_date, status: row.remittance_status, cod_amount: Number(row.amount ?? 0), total_waybills: Number(row.total ?? 0) })), allRows.length, page, limit);
  }

  async getHubReconciliation(query: HubReconciliationQueryDto, currentUser: UserEntity): Promise<Paginated<Record<string, unknown>>> {
    this.assertFinanceRole(currentUser);
    const normalized = await this.normalizeQuery(query, currentUser);
    const page = normalized.page ?? 1;
    const limit = this.resolveLimit(normalized.limit);
    const qb = this.buildReconciliationQuery(normalized, currentUser)
      .select('reconciliation.hub_id', 'hub_id')
      .addSelect('reconciliation.reconciliation_date', 'reconciliation_date')
      .addSelect('COALESCE(SUM(reconciliation.cod_cash_held), 0)', 'cod')
      .addSelect('COALESCE(SUM(reconciliation.cc_cash_held), 0)', 'cc')
      .addSelect('COALESCE(SUM(reconciliation.total_remitted), 0)', 'remitted')
      .groupBy('reconciliation.hub_id')
      .addGroupBy('reconciliation.reconciliation_date')
      .orderBy('reconciliation.reconciliation_date', 'DESC');
    const allRows = await qb.clone().getRawMany<RawFinance>();
    const rows = await qb.offset((page - 1) * limit).limit(limit).getRawMany<RawFinance>();
    return this.paginate(rows.map((row) => {
      const cod = Number(row.cod ?? 0);
      const cc = Number(row.cc ?? 0);
      const remitted = Number(row.remitted ?? 0);
      return { hub_id: row.hub_id, reconciliation_date: row.reconciliation_date, cod_cash_held: cod, cc_cash_held: cc, total_remitted: remitted, remaining_amount: cod + cc - remitted };
    }), allRows.length, page, limit);
  }

  async approveInternalTripCost(tripId: string, dto: ApproveInternalCostDto, currentUser: UserEntity): Promise<Record<string, unknown>> {
    this.assertFinanceRole(currentUser);
    this.assertNonNegative(dto.fuel_actual, dto.fuel_cost, dto.other_costs);
    const trip = await this.getScopedTrip(tripId, currentUser);
    if (!trip.truck_id) throw new BadRequestException('Internal trip must have a truck assignment');
    if (trip.fuel_cost !== null || trip.other_costs !== null) throw new ConflictException('Trip cost has already been approved');
    if (dto.fuel_actual !== undefined) trip.fuel_actual = dto.fuel_actual;
    if (dto.fuel_cost !== undefined) trip.fuel_cost = String(dto.fuel_cost);
    if (dto.other_costs !== undefined) trip.other_costs = String(dto.other_costs);
    return this.sanitizeTripCost(await this.tripsRepository.save(trip), currentUser);
  }

  async approveVendorTripCost(tripId: string, dto: ApproveVendorCostDto, currentUser: UserEntity): Promise<Record<string, unknown>> {
    this.assertFinanceRole(currentUser);
    this.assertNonNegative(dto.fuel_cost, dto.other_costs);
    const trip = await this.getScopedTrip(tripId, currentUser);
    if (trip.fuel_cost !== null || trip.other_costs !== null) throw new ConflictException('Trip cost has already been approved');
    if (dto.fuel_cost !== undefined) trip.fuel_cost = String(dto.fuel_cost);
    if (dto.other_costs !== undefined) trip.other_costs = String(dto.other_costs);
    return this.sanitizeTripCost(await this.tripsRepository.save(trip), currentUser);
  }

  async getPendingInternalCosts(query: QueryReconciliationsDto, currentUser: UserEntity): Promise<Paginated<Record<string, unknown>>> {
    this.assertFinanceRole(currentUser);
    return this.getPendingCosts(query, currentUser, true);
  }

  async getPendingVendorCosts(query: QueryReconciliationsDto, currentUser: UserEntity): Promise<Paginated<Record<string, unknown>>> {
    this.assertFinanceRole(currentUser);
    return this.getPendingCosts(query, currentUser, false);
  }

  buildFinanceScope(currentUser: UserEntity): Scope {
    return { hubId: currentUser.hub_id ?? undefined, canViewSystem: isManager(currentUser.role_mask), canViewProfit: isManager(currentUser.role_mask) };
  }

  private async getPendingCosts(query: QueryReconciliationsDto, currentUser: UserEntity, internal: boolean): Promise<Paginated<Record<string, unknown>>> {
    const normalized = await this.normalizeQuery(query, currentUser, false);
    const page = normalized.page ?? 1;
    const limit = this.resolveLimit(normalized.limit);
    const qb = this.tripsRepository.createQueryBuilder('trip')
      .leftJoinAndSelect('trip.truck', 'truck')
      .leftJoinAndSelect('trip.start_hub', 'start_hub')
      .leftJoinAndSelect('trip.end_hub', 'end_hub')
      .where('trip.fuel_cost IS NULL')
      .andWhere('trip.other_costs IS NULL')
      .orderBy('trip.departure_time', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);
    if (internal) qb.andWhere('trip.truck_id IS NOT NULL');
    else qb.andWhere('trip.truck_id IS NULL');
    this.applyTripScope(qb, normalized.hub_id, currentUser);
    const [items, total] = await qb.getManyAndCount();
    return this.paginate(items.map((item) => this.sanitizeTripCost(item, currentUser)), total, page, limit);
  }

  private buildReconciliationQuery(query: QueryReconciliationsDto, currentUser: UserEntity): SelectQueryBuilder<FinanceReconciliationEntity> {
    const qb = this.reconciliationsRepository.createQueryBuilder('reconciliation');
    if (query.hub_id) qb.andWhere('reconciliation.hub_id = :hubId', { hubId: query.hub_id });
    if (query.reconciliation_date) qb.andWhere('reconciliation.reconciliation_date = :reconciliationDate', { reconciliationDate: query.reconciliation_date });
    if (query.remittance_status) qb.andWhere('reconciliation.remittance_status = :status', { status: query.remittance_status });
    if (query.date_from) qb.andWhere('reconciliation.reconciliation_date >= :dateFrom', { dateFrom: query.date_from });
    if (query.date_to) qb.andWhere('reconciliation.reconciliation_date <= :dateTo', { dateTo: query.date_to });
    this.applyReconciliationScope(qb, currentUser);
    return qb;
  }

  private async getScopedReconciliation(id: string, currentUser: UserEntity): Promise<FinanceReconciliationEntity> {
    const qb = this.reconciliationsRepository.createQueryBuilder('reconciliation').where('reconciliation.id = :id', { id });
    this.applyReconciliationScope(qb, currentUser);
    const reconciliation = await qb.getOne();
    if (!reconciliation) throw new NotFoundException('Reconciliation not found');
    return reconciliation;
  }

  private async getMutableReconciliation(id: string, currentUser: UserEntity): Promise<FinanceReconciliationEntity> {
    const reconciliation = await this.getScopedReconciliation(id, currentUser);
    if (![RemittanceStatus.PENDING, RemittanceStatus.OVERDUE].includes(reconciliation.remittance_status)) throw new BadRequestException('Only PENDING or OVERDUE reconciliations can be updated');
    return reconciliation;
  }

  private async getScopedTrip(tripId: string, currentUser: UserEntity): Promise<TripEntity> {
    const qb = this.tripsRepository.createQueryBuilder('trip').leftJoinAndSelect('trip.truck', 'truck').where('trip.id = :tripId', { tripId });
    this.applyTripScope(qb, undefined, currentUser);
    const trip = await qb.getOne();
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  private async normalizeQuery<T extends QueryReconciliationsDto>(query: T, currentUser: UserEntity, validateDates = true): Promise<T> {
    const limit = this.resolveLimit(query.limit);
    if (query.hub_id) {
      await this.assertHubExists(query.hub_id, false);
      this.assertHubAccess(query.hub_id, currentUser);
    }
    if (validateDates) this.validateDateRange(query.date_from, query.date_to);
    return { ...query, limit };
  }

  private validateDateRange(from?: string, to?: string): void {
    if (from && Number.isNaN(new Date(from).getTime())) throw new BadRequestException('Invalid date_from');
    if (to && Number.isNaN(new Date(to).getTime())) throw new BadRequestException('Invalid date_to');
    if (from && to && new Date(from).getTime() > new Date(to).getTime()) throw new BadRequestException('date_from must be before or equal to date_to');
  }

  private validateReconciliationDate(date: string): void {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) throw new BadRequestException('Invalid reconciliation date');
    const maxFuture = Date.now() + 7 * 24 * 60 * 60 * 1000;
    if (parsed.getTime() > maxFuture) throw new BadRequestException('Reconciliation date is too far in the future');
  }

  private async assertHubExists(hubId: string, requireActive: boolean): Promise<void> {
    const hub = await this.hubsRepository.findOne({ where: requireActive ? { id: hubId, is_active: true } : { id: hubId } });
    if (!hub) throw new NotFoundException('Hub not found');
  }

  private assertFinanceRole(currentUser: UserEntity): void {
    if ([Roles.ACCOUNTANT, Roles.MANAGER, Roles.DIRECTOR].some((role) => hasRole(currentUser.role_mask, role))) return;
    throw new ForbiddenException('Insufficient role permissions for finance');
  }

  private assertHubAccess(hubId: string, currentUser: UserEntity): void {
    if (isManager(currentUser.role_mask)) return;
    if (currentUser.hub_id !== hubId) throw new ForbiddenException('User cannot access finance data outside assigned hub');
  }

  private applyReconciliationScope(qb: SelectQueryBuilder<FinanceReconciliationEntity>, currentUser: UserEntity): void {
    if (isManager(currentUser.role_mask)) return;
    if (!currentUser.hub_id) throw new ForbiddenException('User is not assigned to a hub');
    qb.andWhere('reconciliation.hub_id = :userHubId', { userHubId: currentUser.hub_id });
  }

  private applyTripScope(qb: SelectQueryBuilder<TripEntity>, hubId: string | undefined, currentUser: UserEntity): void {
    if (isManager(currentUser.role_mask) && !hubId) return;
    const scopedHubId = hubId ?? currentUser.hub_id;
    if (!scopedHubId) throw new ForbiddenException('User is not assigned to a hub');
    qb.andWhere(new Brackets((inner) => inner.where('trip.start_hub_id = :hubId', { hubId: scopedHubId }).orWhere('trip.end_hub_id = :hubId', { hubId: scopedHubId })));
  }

  private applyWaybillScope(qb: SelectQueryBuilder<WaybillEntity>, hubId: string | undefined, currentUser: UserEntity): void {
    if (isManager(currentUser.role_mask) && !hubId) return;
    const scopedHubId = hubId ?? currentUser.hub_id;
    if (!scopedHubId) throw new ForbiddenException('User is not assigned to a hub');
    qb.andWhere(new Brackets((inner) => inner.where('waybill.origin_hub_id = :hubId', { hubId: scopedHubId }).orWhere('waybill.dest_hub_id = :hubId', { hubId: scopedHubId }).orWhere('waybill.current_hub_id = :hubId', { hubId: scopedHubId })));
  }

  private applyDateRangeToWaybill(qb: SelectQueryBuilder<WaybillEntity>, query: QueryReconciliationsDto): void {
    if (query.date_from) qb.andWhere('waybill.created_at >= :dateFrom', { dateFrom: query.date_from });
    if (query.date_to) qb.andWhere('waybill.created_at <= :dateTo', { dateTo: query.date_to });
  }

  private resolveRemittanceStatus(cod: number, cc: number, remitted: number, fallback = RemittanceStatus.PENDING): RemittanceStatus {
    if (remitted >= cod + cc) return RemittanceStatus.REMITTED;
    return fallback === RemittanceStatus.OVERDUE ? RemittanceStatus.OVERDUE : RemittanceStatus.PENDING;
  }

  private assertNonNegative(...values: Array<number | undefined>): void {
    if (values.some((value) => value !== undefined && value < 0)) throw new BadRequestException('Amounts and costs must not be negative');
  }

  private resolveLimit(limit = 20): number {
    return Math.min(limit, 100);
  }

  private sanitizeReconciliation(reconciliation: FinanceReconciliationEntity, currentUser: UserEntity): Record<string, unknown> {
    return {
      id: reconciliation.id,
      hub_id: reconciliation.hub_id,
      reconciliation_date: reconciliation.reconciliation_date,
      cod_cash_held: Number(reconciliation.cod_cash_held),
      cc_cash_held: Number(reconciliation.cc_cash_held),
      total_remitted: Number(reconciliation.total_remitted),
      remaining_amount: Number(reconciliation.cod_cash_held) + Number(reconciliation.cc_cash_held) - Number(reconciliation.total_remitted),
      remittance_status: reconciliation.remittance_status,
      remitted_at: reconciliation.remitted_at,
      hub: reconciliation.hub ? { id: reconciliation.hub.id, code: reconciliation.hub.code, name: reconciliation.hub.name } : undefined,
      can_view_profit: isManager(currentUser.role_mask),
    };
  }

  private sanitizeTripCost(trip: TripEntity, currentUser: UserEntity): Record<string, unknown> {
    const result: Record<string, unknown> = {
      id: trip.id,
      truck_id: trip.truck_id,
      manifest_id: trip.manifest_id,
      start_hub_id: trip.start_hub_id,
      end_hub_id: trip.end_hub_id,
      fuel_actual: trip.fuel_actual,
      fuel_cost: trip.fuel_cost == null ? null : Number(trip.fuel_cost),
      other_costs: trip.other_costs == null ? null : Number(trip.other_costs),
      status: trip.status,
      departure_time: trip.departure_time,
    };
    if (isManager(currentUser.role_mask)) result.profit_visible = true;
    return result;
  }

  private paginate<T>(items: T[], total: number, page: number, limit: number): Paginated<T> {
    return { items, meta: { total, page, limit, total_pages: Math.ceil(total / limit) } };
  }
}




