import * as bcrypt from 'bcrypt';
import { BusinessTablesService } from './business-tables.service';

jest.mock('bcrypt', () => ({ hash: jest.fn() }));

const createRepository = () => ({
  create: jest.fn((payload) => payload),
  save: jest.fn(async (payload) => ({ id: '1', ...payload })),
  findOne: jest.fn(async ({ where }: any) => (where.id === 'missing' ? null : { id: where.id, warehouse_name: 'Kho A' })),
  delete: jest.fn(async () => ({ affected: 1 })),
  createQueryBuilder: jest.fn(() => ({
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(async () => [[{ id: '1', warehouse_name: 'Kho A' }], 1]),
    getOne: jest.fn(async () => null),
  })),
});

describe('BusinessTablesService', () => {
  let repositories: ReturnType<typeof createRepository>[];
  let service: BusinessTablesService;

  beforeEach(() => {
    repositories = Array.from({ length: 10 }, () => createRepository());
    service = new BusinessTablesService(
      repositories[0] as any,
      repositories[1] as any,
      repositories[2] as any,
      repositories[3] as any,
      repositories[4] as any,
      repositories[5] as any,
      repositories[6] as any,
      repositories[7] as any,
      repositories[8] as any,
      repositories[9] as any,
    );
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  it('lists records with paging metadata', async () => {
    const result = await service.list('warehouses', { page: 1, limit: 20 });

    expect(result).toEqual({ data: [{ id: '1', warehouse_name: 'Kho A' }], total: 1, page: 1, limit: 20 });
  });

  it('creates, updates, and deletes a warehouse', async () => {
    await expect(service.create('warehouses', { warehouse_name: 'Kho B' })).resolves.toMatchObject({ id: '1', warehouse_name: 'Kho B' });
    await expect(service.update('warehouses', '1', { warehouse_name: 'Kho C' })).resolves.toMatchObject({ id: '1', warehouse_name: 'Kho C' });
    await expect(service.remove('warehouses', '1')).resolves.toBeUndefined();
  });

  it('rejects negative numeric values', async () => {
    await expect(service.create('vehicleCosts', { cost_date: '2026-06-02', license_plate: '51A-12345', vehicle_type: 'Tải', cost_type: 'Dầu', amount: -1, status: 'PENDING' })).rejects.toThrow('amount must be a non-negative number');
  });

  it('hashes staff password and never returns password_hash', async () => {
    const result = await service.create('staffMembers', { full_name: 'Nguyễn A', department: 'Kho', position: 'Nhân viên', phone: '0900000000', password: 'secret123' });

    expect(bcrypt.hash).toHaveBeenCalledWith('secret123', 10);
    expect(repositories[4].create).toHaveBeenCalledWith(expect.objectContaining({ password_hash: 'hashed-password' }));
    expect(result).not.toHaveProperty('password_hash');
  });
});
