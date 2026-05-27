import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { TripStatus } from '../common/enums';
import { Roles } from '../common/roles';
import { TripEntity } from '../trips/trip.entity';
import { UserEntity } from '../users/user.entity';
import { CreateTruckDto } from './dto/create-truck.dto';
import { QueryTrucksDto } from './dto/query-trucks.dto';
import { TruckStatus } from './dto/truck.enums';
import { UpdateTruckStatusDto } from './dto/update-truck-status.dto';
import { UpdateTruckDto } from './dto/update-truck.dto';
import { TruckEntity } from './truck.entity';

const ACTIVE_TRIP_STATUSES = [TripStatus.PLANNED, 'LOADING', TripStatus.IN_TRANSIT, 'ARRIVED_PENDING_CONFIRM'];
const TRIP_LOCK_STATUSES = [TripStatus.PLANNED, 'LOADING', TripStatus.IN_TRANSIT, TripStatus.ARRIVED, 'ARRIVED_PENDING_CONFIRM'];

@Injectable()
export class TrucksService {
  constructor(
    @InjectRepository(TruckEntity) private readonly trucksRepository: Repository<TruckEntity>,
    @InjectRepository(UserEntity) private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(TripEntity) private readonly tripsRepository: Repository<TripEntity>,
  ) {}

  async create(dto: CreateTruckDto, currentUser: UserEntity): Promise<TruckEntity> {
    this.assertRole(currentUser, [Roles.MANAGER, Roles.DIRECTOR]);
    const licensePlate = this.normalizePlate(dto.license_plate);
    await this.assertUniquePlate(licensePlate);
    if (dto.driver_id) await this.assertDriverExists(dto.driver_id);

    const truck = this.trucksRepository.create({
      license_plate: licensePlate,
      payload: dto.payload,
      driver_id: dto.driver_id ?? null,
      fuel_consumption_limit: dto.fuel_consumption_limit ?? 0,
      status: dto.status ?? TruckStatus.AVAILABLE,
    });

    try {
      return await this.trucksRepository.save(truck);
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('Truck license plate already exists');
      throw error;
    }
  }

  async findAll(query: QueryTrucksDto, _currentUser: UserEntity) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const qb = this.trucksRepository.createQueryBuilder('truck');
    this.applyFilters(qb, query);
    const [items, total] = await qb.orderBy('truck.id', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items, meta: { total, page, limit, total_pages: Math.ceil(total / limit) } };
  }

  async findAvailableTrucks(query: QueryTrucksDto, currentUser: UserEntity) {
    const result = await this.findAll({ ...query, status: TruckStatus.AVAILABLE }, currentUser);
    return { ...result, items: result.items.filter((truck) => truck.status === TruckStatus.AVAILABLE) };
  }

  async findOne(id: string, _currentUser: UserEntity): Promise<TruckEntity> {
    const truck = await this.trucksRepository.findOne({ where: { id } as any, relations: ['driver', 'trips'] });
    if (!truck) throw new NotFoundException('Truck not found');
    return truck;
  }

  async update(id: string, dto: UpdateTruckDto, currentUser: UserEntity): Promise<TruckEntity> {
    this.assertRole(currentUser, [Roles.MANAGER, Roles.DIRECTOR]);
    const truck = await this.findOne(id, currentUser);
    if (dto.license_plate) {
      const licensePlate = this.normalizePlate(dto.license_plate);
      await this.assertUniquePlate(licensePlate, id);
      truck.license_plate = licensePlate;
    }
    if (dto.driver_id) await this.assertDriverExists(dto.driver_id);
    Object.assign(truck, {
      payload: dto.payload ?? truck.payload,
      driver_id: dto.driver_id ?? truck.driver_id,
      fuel_consumption_limit: dto.fuel_consumption_limit ?? truck.fuel_consumption_limit,
      status: dto.status ?? truck.status,
    });
    return this.trucksRepository.save(truck);
  }

  async updateStatus(id: string, dto: UpdateTruckStatusDto, currentUser: UserEntity): Promise<TruckEntity> {
    this.assertRole(currentUser, [Roles.MANAGER, Roles.DIRECTOR]);
    const truck = await this.findOne(id, currentUser);
    if ([TruckStatus.MAINTENANCE, TruckStatus.INACTIVE].includes(dto.status)) await this.assertNoActiveTrips(id, 'change status');
    truck.status = dto.status;
    return this.trucksRepository.save(truck);
  }

  async softDelete(id: string, currentUser: UserEntity) {
    this.assertRole(currentUser, [Roles.DIRECTOR]);
    await this.findOne(id, currentUser);
    await this.assertNoActiveTrips(id, 'delete truck');
    await this.trucksRepository.delete(id);
  }

  private applyFilters(qb: any, query: QueryTrucksDto) {
    if (query.keyword?.trim()) {
      const keyword = `%${query.keyword.trim()}%`;
      qb.andWhere(new Brackets((builder) => builder.where('truck.license_plate ILIKE :keyword', { keyword })));
    }
    const statuses = this.parseList(query.status);
    if (statuses.length) qb.andWhere('truck.status IN (:...statuses)', { statuses });
    if (query.driver_id) qb.andWhere('truck.driver_id = :driverId', { driverId: query.driver_id });
  }

  private parseList(value?: string): string[] {
    return value?.split(',').map((item) => item.trim()).filter(Boolean) ?? [];
  }

  private async assertUniquePlate(licensePlate: string, ignoreId?: string) {
    const qb = this.trucksRepository.createQueryBuilder('truck').where('truck.license_plate = :licensePlate', { licensePlate });
    if (ignoreId) qb.andWhere('truck.id != :ignoreId', { ignoreId });
    const existing = await qb.getOne();
    if (existing) throw new ConflictException('Truck license plate already exists');
  }

  private async assertDriverExists(driverId: string): Promise<UserEntity> {
    const driver = await this.usersRepository.findOne({ where: { id: driverId } as any });
    if (!driver) throw new NotFoundException('Driver not found');
    if ((driver.role_mask & Roles.DRIVER) === 0) throw new BadRequestException('Assigned user must have DRIVER role');
    return driver;
  }

  private async assertNoActiveTrips(truckId: string, action: string) {
    const activeTrips = await this.tripsRepository.count({ where: { truck_id: truckId, status: In(TRIP_LOCK_STATUSES as any[]) } as any });
    if (activeTrips > 0) throw new BadRequestException(`Cannot ${action} with active trips`);
  }

  private normalizePlate(licensePlate: string) {
    const normalized = licensePlate.trim().toUpperCase();
    if (!normalized) throw new BadRequestException('Truck license plate is required');
    return normalized;
  }

  private assertRole(currentUser: UserEntity, roles: number[]) {
    if (!roles.some((role) => (currentUser.role_mask & role) !== 0)) throw new ForbiddenException('Insufficient role permissions');
  }
}
