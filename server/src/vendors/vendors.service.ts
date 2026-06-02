import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { clampPaginationLimit } from '../common/pagination';
import { Roles } from '../common/roles';
import { UserEntity } from '../users/user.entity';
import { QueryVendorsDto } from './dto/query-vendors.dto';
import { UpdateVendorStatusDto } from './dto/update-vendor-status.dto';
import { UpsertVendorDto } from './dto/upsert-vendor.dto';
import { VendorEntity } from './vendor.entity';

const mutableFields: Array<keyof UpsertVendorDto> = ['code', 'name', 'service_type', 'contact_name', 'phone', 'email', 'province', 'contract_type', 'status', 'routes', 'pricing', 'metadata'];

@Injectable()
export class VendorsService {
  constructor(@InjectRepository(VendorEntity) private readonly vendorsRepository: Repository<VendorEntity>) {}

  async create(dto: UpsertVendorDto, currentUser: UserEntity) {
    this.assertRole(currentUser, [Roles.MANAGER, Roles.DIRECTOR]);
    if (dto.code) await this.assertUniqueCode(dto.code);
    const vendor = this.vendorsRepository.create(this.pickMutable(dto));
    vendor.status = vendor.status || 'ACTIVE';
    return this.vendorsRepository.save(vendor);
  }

  async findAll(query: QueryVendorsDto) {
    const page = query.page ?? 1;
    const limit = clampPaginationLimit(query.limit, 20);
    const qb = this.vendorsRepository.createQueryBuilder('vendor');
    this.applyFilters(qb, query);
    const [items, total] = await qb.orderBy('vendor.id', 'DESC').skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items, meta: { total, page, limit, total_pages: Math.ceil(total / limit) } };
  }

  async findActive(query: QueryVendorsDto) {
    return this.findAll({ ...query, status: 'ACTIVE' });
  }

  async findOne(id: string) {
    const vendor = await this.vendorsRepository.findOne({ where: { id } });
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async update(id: string, dto: UpsertVendorDto, currentUser: UserEntity) {
    this.assertRole(currentUser, [Roles.MANAGER, Roles.DIRECTOR]);
    const vendor = await this.findOne(id);
    if (dto.code && dto.code !== vendor.code) await this.assertUniqueCode(dto.code, id);
    Object.assign(vendor, this.pickMutable(dto));
    return this.vendorsRepository.save(vendor);
  }

  async updateStatus(id: string, dto: UpdateVendorStatusDto, currentUser: UserEntity) {
    this.assertRole(currentUser, [Roles.MANAGER, Roles.DIRECTOR]);
    const vendor = await this.findOne(id);
    vendor.status = dto.status;
    return this.vendorsRepository.save(vendor);
  }

  async updateRoutes(id: string, routes: Record<string, unknown> | unknown[], currentUser: UserEntity) {
    this.assertRole(currentUser, [Roles.MANAGER, Roles.DIRECTOR]);
    const vendor = await this.findOne(id);
    vendor.routes = routes;
    return this.vendorsRepository.save(vendor);
  }

  async updatePricing(id: string, pricing: Record<string, unknown> | unknown[], currentUser: UserEntity) {
    this.assertRole(currentUser, [Roles.MANAGER, Roles.DIRECTOR]);
    const vendor = await this.findOne(id);
    vendor.pricing = pricing;
    return this.vendorsRepository.save(vendor);
  }

  async delete(id: string, currentUser: UserEntity) {
    this.assertRole(currentUser, [Roles.DIRECTOR]);
    await this.findOne(id);
    await this.vendorsRepository.delete(id);
  }

  private applyFilters(qb: any, query: QueryVendorsDto) {
    if (query.keyword?.trim()) {
      const keyword = `%${query.keyword.trim()}%`;
      qb.andWhere(new Brackets((builder) => builder.where('vendor.code ILIKE :keyword', { keyword }).orWhere('vendor.name ILIKE :keyword', { keyword }).orWhere('vendor.contact_name ILIKE :keyword', { keyword }).orWhere('vendor.phone ILIKE :keyword', { keyword }).orWhere('vendor.email ILIKE :keyword', { keyword })));
    }
    ['status', 'service_type', 'province', 'contract_type'].forEach((field) => {
      const value = (query as Record<string, string | undefined>)[field];
      if (value) qb.andWhere(`vendor.${field} = :${field}`, { [field]: value });
    });
  }

  private pickMutable(dto: UpsertVendorDto) {
    return Object.fromEntries(mutableFields.filter((field) => dto[field] !== undefined).map((field) => [field, dto[field]]));
  }

  private async assertUniqueCode(code: string, currentId?: string) {
    const existing = await this.vendorsRepository.findOne({ where: { code } });
    if (existing && existing.id !== currentId) throw new ConflictException('Vendor code already exists');
  }

  private assertRole(currentUser: UserEntity, roles: number[]) {
    if (!roles.some((role) => (currentUser.role_mask & role) !== 0)) throw new ForbiddenException('Insufficient role permissions');
  }
}
