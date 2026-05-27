import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Not, Repository } from 'typeorm';
import { TripStatus, WaybillState } from '../common/enums';
import { Roles, isManager } from '../common/roles';
import { HubEntity } from '../hubs/hub.entity';
import { ManifestStatus } from '../manifests/dto/manifest.enums';
import { ManifestWaybillEntity } from '../manifests/manifest-waybill.entity';
import { ManifestEntity } from '../manifests/manifest.entity';
import { TruckStatus } from '../trucks/dto/truck.enums';
import { TruckEntity } from '../trucks/truck.entity';
import { UserEntity } from '../users/user.entity';
import { WaybillEntity } from '../waybills/waybill.entity';
import { ArriveTripDto } from './dto/arrive-trip.dto';
import { AssignManifestDto } from './dto/assign-manifest.dto';
import { CreateTripDto } from './dto/create-trip.dto';
import { QueryTripsDto } from './dto/query-trips.dto';
import { UpdateTripCostsDto } from './dto/update-trip-costs.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripEntity } from './trip.entity';

const ACTIVE_TRIP_STATUSES = [TripStatus.PLANNED, TripStatus.IN_TRANSIT];

type Money = string | number | null | undefined;

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(TripEntity) private readonly tripsRepository: Repository<TripEntity>,
    @InjectRepository(TruckEntity) private readonly trucksRepository: Repository<TruckEntity>,
    @InjectRepository(ManifestEntity) private readonly manifestsRepository: Repository<ManifestEntity>,
    @InjectRepository(ManifestWaybillEntity) private readonly manifestWaybillsRepository: Repository<ManifestWaybillEntity>,
    @InjectRepository(WaybillEntity) private readonly waybillsRepository: Repository<WaybillEntity>,
    @InjectRepository(HubEntity) private readonly hubsRepository: Repository<HubEntity>,
  ) {}

  async create(dto: CreateTripDto, currentUser: UserEntity): Promise<TripEntity> {
    const truck = await this.validateTruck(dto.truck_id);
    const manifest = await this.validateManifestForAssignment(String(dto.manifest_id));
    await this.validateHubs(String(dto.start_hub_id), String(dto.end_hub_id), manifest);
    await this.assertManifestNotInActiveTrip(String(dto.manifest_id));
    this.validateTripTimes(dto.departure_time, dto.arrival_time);

    const trip = this.tripsRepository.create({
      truck_id: dto.truck_id == null ? null : String(dto.truck_id),
      manifest_id: String(dto.manifest_id),
      start_hub_id: String(dto.start_hub_id),
      end_hub_id: String(dto.end_hub_id),
      departure_time: dto.departure_time,
      arrival_time: dto.arrival_time ?? null,
      status: TripStatus.PLANNED,
    });

    const savedTrip = await this.tripsRepository.save(trip);
    manifest.status = ManifestStatus.ASSIGNED_TO_TRIP;
    await this.manifestsRepository.save(manifest);
    if (truck) {
      truck.status = TruckStatus.ASSIGNED;
      await this.trucksRepository.save(truck);
    }
    return savedTrip;
  }

  async findAll(query: QueryTripsDto, currentUser: UserEntity) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const qb = this.tripsRepository.createQueryBuilder('trip')
      .leftJoinAndSelect('trip.truck', 'truck')
      .leftJoinAndSelect('trip.manifest', 'manifest')
      .leftJoinAndSelect('trip.start_hub', 'start_hub')
      .leftJoinAndSelect('trip.end_hub', 'end_hub')
      .orderBy('trip.departure_time', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.keyword) {
      qb.andWhere(new Brackets((inner) => {
        inner.where('manifest.manifest_code ILIKE :keyword', { keyword: `%${query.keyword}%` })
          .orWhere('truck.license_plate ILIKE :keyword', { keyword: `%${query.keyword}%` });
      }));
    }
    if (query.status) qb.andWhere('trip.status = :status', { status: query.status });
    if (query.truck_id) qb.andWhere('trip.truck_id = :truckId', { truckId: String(query.truck_id) });
    if (query.start_hub_id) qb.andWhere('trip.start_hub_id = :startHubId', { startHubId: String(query.start_hub_id) });
    if (query.end_hub_id) qb.andWhere('trip.end_hub_id = :endHubId', { endHubId: String(query.end_hub_id) });
    if (query.departure_from) qb.andWhere('trip.departure_time >= :departureFrom', { departureFrom: query.departure_from });
    if (query.departure_to) qb.andWhere('trip.departure_time <= :departureTo', { departureTo: query.departure_to });
    this.applyHubScope(qb, currentUser);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string, currentUser: UserEntity): Promise<TripEntity> {
    const qb = this.tripsRepository.createQueryBuilder('trip')
      .leftJoinAndSelect('trip.truck', 'truck')
      .leftJoinAndSelect('trip.manifest', 'manifest')
      .leftJoinAndSelect('trip.start_hub', 'start_hub')
      .leftJoinAndSelect('trip.end_hub', 'end_hub')
      .where('trip.id = :id', { id });
    this.applyHubScope(qb, currentUser);
    const trip = await qb.getOne();
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async update(id: string, dto: UpdateTripDto, currentUser: UserEntity): Promise<TripEntity> {
    const trip = await this.findOne(id, currentUser);
    if (trip.status !== TripStatus.PLANNED) throw new BadRequestException('Only PLANNED trips can be updated');
    if (dto.truck_id !== undefined) {
      const truck = await this.validateTruck(dto.truck_id);
      if (trip.truck_id && trip.truck_id !== String(dto.truck_id)) {
        const oldTruck = await this.trucksRepository.findOne({ where: { id: trip.truck_id } });
        if (oldTruck) {
          oldTruck.status = TruckStatus.AVAILABLE;
          await this.trucksRepository.save(oldTruck);
        }
      }
      trip.truck_id = dto.truck_id == null ? null : String(dto.truck_id);
      if (truck) {
        truck.status = TruckStatus.ASSIGNED;
        await this.trucksRepository.save(truck);
      }
    }
    if (dto.departure_time || dto.arrival_time) this.validateTripTimes(dto.departure_time ?? trip.departure_time, dto.arrival_time ?? trip.arrival_time ?? undefined, false);
    if (dto.departure_time) trip.departure_time = dto.departure_time;
    if (dto.arrival_time !== undefined) trip.arrival_time = dto.arrival_time;
    return this.tripsRepository.save(trip);
  }

  async assignManifest(id: string, dto: AssignManifestDto, currentUser: UserEntity): Promise<TripEntity> {
    const trip = await this.findOne(id, currentUser);
    if (trip.status !== TripStatus.PLANNED) throw new BadRequestException('Only PLANNED trips can receive a manifest');
    const manifest = await this.validateManifestForAssignment(String(dto.manifest_id));
    await this.assertManifestNotInActiveTrip(String(dto.manifest_id), id);
    await this.validateHubs(trip.start_hub_id, trip.end_hub_id, manifest);
    trip.manifest_id = String(dto.manifest_id);
    manifest.status = ManifestStatus.ASSIGNED_TO_TRIP;
    await this.manifestsRepository.save(manifest);
    return this.tripsRepository.save(trip);
  }

  async startTrip(id: string, currentUser: UserEntity): Promise<TripEntity> {
    const trip = await this.findOne(id, currentUser);
    if (trip.status !== TripStatus.PLANNED) throw new BadRequestException('Only PLANNED trips can start');
    if (!trip.manifest_id) throw new BadRequestException('Trip must have a manifest before start');
    const manifest = await this.manifestsRepository.findOne({ where: { id: trip.manifest_id } });
    if (!manifest) throw new NotFoundException('Manifest not found');

    trip.status = TripStatus.IN_TRANSIT;
    trip.departure_time = trip.departure_time ?? new Date();
    manifest.status = ManifestStatus.IN_TRANSIT;
    await this.manifestsRepository.save(manifest);
    await this.setTruckStatus(trip.truck_id, TruckStatus.IN_TRIP);
    await this.moveManifestWaybills(trip.manifest_id, WaybillState.MANIFEST_CLOSED, WaybillState.IN_TRANSIT);
    return this.tripsRepository.save(trip);
  }

  async arriveTrip(id: string, dto: ArriveTripDto, currentUser: UserEntity): Promise<TripEntity> {
    const trip = await this.findOne(id, currentUser);
    if (trip.status !== TripStatus.IN_TRANSIT) throw new BadRequestException('Only IN_TRANSIT trips can arrive');
    trip.status = TripStatus.ARRIVED;
    trip.arrival_time = dto.arrival_time ?? new Date();
    await this.moveManifestWaybills(trip.manifest_id, WaybillState.IN_TRANSIT, WaybillState.AT_DEST_HUB);
    return this.tripsRepository.save(trip);
  }

  async completeTrip(id: string, currentUser: UserEntity): Promise<TripEntity> {
    const trip = await this.findOne(id, currentUser);
    if (trip.status !== TripStatus.ARRIVED) throw new BadRequestException('Only ARRIVED trips can be completed');
    trip.status = TripStatus.COMPLETED;
    const manifest = await this.manifestsRepository.findOne({ where: { id: trip.manifest_id } });
    if (manifest) {
      manifest.status = ManifestStatus.COMPLETED;
      await this.manifestsRepository.save(manifest);
    }
    if (trip.truck_id) {
      const activeTrips = await this.tripsRepository.count({ where: { truck_id: trip.truck_id, status: In(ACTIVE_TRIP_STATUSES), id: Not(trip.id) } as any });
      if (activeTrips === 0) await this.setTruckStatus(trip.truck_id, TruckStatus.AVAILABLE);
    }
    return this.tripsRepository.save(trip);
  }

  async updateCosts(id: string, dto: UpdateTripCostsDto, currentUser: UserEntity): Promise<TripEntity> {
    this.assertNonNegative(dto.fuel_actual, dto.fuel_cost, dto.other_costs);
    const trip = await this.findOne(id, currentUser);
    if (dto.fuel_actual !== undefined) trip.fuel_actual = dto.fuel_actual;
    if (dto.fuel_cost !== undefined) trip.fuel_cost = String(dto.fuel_cost);
    if (dto.other_costs !== undefined) trip.other_costs = String(dto.other_costs);
    return this.tripsRepository.save(trip);
  }

  async getTripProfit(id: string, currentUser: UserEntity) {
    if (!isManager(currentUser.role_mask)) throw new ForbiddenException('Manager or Director role required');
    const trip = await this.findOne(id, currentUser);
    const waybills = await this.getManifestWaybills(trip.manifest_id);
    const revenue = waybills.reduce((sum, waybill) => sum + Number(waybill.cost_amount ?? 0), 0);
    const total_cost = this.toNumber(trip.fuel_cost) + this.toNumber(trip.other_costs);
    return { revenue, total_cost, profit: revenue - total_cost, waybill_count: waybills.length };
  }

  private async validateTruck(truckId?: number | null): Promise<TruckEntity | null> {
    if (truckId == null) return null;
    const truck = await this.trucksRepository.findOne({ where: { id: String(truckId) } });
    if (!truck) throw new NotFoundException('Truck not found');
    if (truck.status !== TruckStatus.AVAILABLE) throw new BadRequestException('Truck must be AVAILABLE');
    return truck;
  }

  private async validateManifestForAssignment(manifestId: string): Promise<ManifestEntity> {
    const manifest = await this.manifestsRepository.findOne({ where: { id: manifestId } });
    if (!manifest) throw new NotFoundException('Manifest not found');
    if (manifest.status !== ManifestStatus.CLOSED) throw new BadRequestException('Manifest must be CLOSED');
    return manifest;
  }

  private async validateHubs(startHubId: string, endHubId: string, manifest: ManifestEntity): Promise<void> {
    const hubs = await this.hubsRepository.find({ where: { id: In([startHubId, endHubId]) } });
    if (hubs.length !== new Set([startHubId, endHubId]).size) throw new NotFoundException('Hub not found');
    if (manifest.origin_hub_id && manifest.origin_hub_id !== startHubId) throw new BadRequestException('Start hub must match manifest origin hub');
    if (manifest.dest_hub_id && manifest.dest_hub_id !== endHubId) throw new BadRequestException('End hub must match manifest destination hub');
  }

  private async assertManifestNotInActiveTrip(manifestId: string, excludeTripId?: string): Promise<void> {
    const qb = this.tripsRepository.createQueryBuilder('trip')
      .where('trip.manifest_id = :manifestId', { manifestId })
      .andWhere('trip.status IN (:...statuses)', { statuses: ACTIVE_TRIP_STATUSES });
    if (excludeTripId) qb.andWhere('trip.id != :excludeTripId', { excludeTripId });
    if (await qb.getOne()) throw new ConflictException('Manifest is already assigned to an active trip');
  }

  private validateTripTimes(departureTime: Date, arrivalTime?: Date | null, requireFuture = true): void {
    if (requireFuture && departureTime.getTime() < Date.now() - 1000) throw new BadRequestException('Departure time must be now or in the future');
    if (arrivalTime && arrivalTime.getTime() <= departureTime.getTime()) throw new BadRequestException('Arrival time must be after departure time');
  }

  private applyHubScope(qb: any, currentUser: UserEntity): void {
    if (isManager(currentUser.role_mask)) return;
    if (!currentUser.hub_id) return;
    qb.andWhere(new Brackets((inner) => {
      inner.where('trip.start_hub_id = :userHubId', { userHubId: currentUser.hub_id })
        .orWhere('trip.end_hub_id = :userHubId', { userHubId: currentUser.hub_id });
    }));
  }

  private async moveManifestWaybills(manifestId: string, from: WaybillState, to: WaybillState): Promise<void> {
    const waybills = await this.getManifestWaybills(manifestId);
    const changed = waybills.filter((waybill) => waybill.current_state === from);
    changed.forEach((waybill) => { waybill.current_state = to; });
    if (changed.length) await this.waybillsRepository.save(changed);
  }

  private async getManifestWaybills(manifestId: string): Promise<WaybillEntity[]> {
    const rows = await this.manifestWaybillsRepository.find({ where: { manifest_id: manifestId }, relations: ['waybill'] });
    return rows.map((row) => row.waybill).filter(Boolean);
  }

  private async setTruckStatus(truckId: string | null, status: TruckStatus): Promise<void> {
    if (!truckId) return;
    const truck = await this.trucksRepository.findOne({ where: { id: truckId } });
    if (!truck) return;
    truck.status = status;
    await this.trucksRepository.save(truck);
  }

  private assertNonNegative(...values: Array<number | undefined>): void {
    if (values.some((value) => value !== undefined && value < 0)) throw new BadRequestException('Costs must not be negative');
  }

  private toNumber(value: Money): number {
    return Number(value ?? 0);
  }
}
