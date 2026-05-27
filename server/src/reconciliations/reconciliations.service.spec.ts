import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RemittanceStatus } from '../common/enums';
import { Roles } from '../common/roles';
import { HubEntity } from '../hubs/hub.entity';
import { ReconciliationEntity } from './reconciliation.entity';
import { ReconciliationsService } from './reconciliations.service';

const accountant = { id: '1', role_mask: Roles.ACCOUNTANT, hub_id: null } as any;
const manager = { id: '2', role_mask: Roles.MANAGER, hub_id: null } as any;
const director = { id: '3', role_mask: Roles.DIRECTOR, hub_id: null } as any;
const driver = { id: '4', role_mask: Roles.DRIVER, hub_id: '10' } as any;

class MockQb {
  where = jest.fn().mockReturnThis();
  andWhere = jest.fn().mockReturnThis();
  leftJoinAndSelect = jest.fn().mockReturnThis();
  orderBy = jest.fn().mockReturnThis();
  skip = jest.fn().mockReturnThis();
  take = jest.fn().mockReturnThis();
  getOne = jest.fn();
  getManyAndCount = jest.fn();
}

const repo = () => ({
  create: jest.fn((value) => value),
  save: jest.fn(async (value) => value),
  remove: jest.fn(async (value) => value),
  findOne: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(),
});

const today = () => new Date().toISOString().slice(0, 10);
const futureDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

describe('ReconciliationsService', () => {
  let service: ReconciliationsService;
  let reconciliations: any;
  let hubs: any;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ReconciliationsService,
        { provide: getRepositoryToken(ReconciliationEntity), useFactory: repo },
        { provide: getRepositoryToken(HubEntity), useFactory: repo },
      ],
    }).compile();

    service = module.get(ReconciliationsService);
    reconciliations = module.get(getRepositoryToken(ReconciliationEntity));
    hubs = module.get(getRepositoryToken(HubEntity));
  });

  const validDto = () => ({ hub_id: 10, reconciliation_date: today(), cod_cash_held: 100, cc_cash_held: 50, total_remitted: 10 });

  describe('create', () => {
    it('tạo thành công với dữ liệu hợp lệ', async () => {
      hubs.findOne.mockResolvedValue({ id: '10' });
      reconciliations.findOne.mockResolvedValue(null);
      await expect(service.create(validDto(), accountant)).resolves.toMatchObject({ hub_id: '10', cod_cash_held: '100' });
    });

    it('remittance_status mặc định = PENDING', async () => {
      hubs.findOne.mockResolvedValue({ id: '10' });
      reconciliations.findOne.mockResolvedValue(null);
      await expect(service.create(validDto(), accountant)).resolves.toMatchObject({ remittance_status: RemittanceStatus.PENDING, remitted_at: null });
    });

    it('hub không tồn tại → NotFoundException', async () => {
      hubs.findOne.mockResolvedValue(null);
      await expect(service.create(validDto(), accountant)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('trùng hub_id + reconciliation_date → ConflictException', async () => {
      hubs.findOne.mockResolvedValue({ id: '10' });
      reconciliations.findOne.mockResolvedValue({ id: '1' });
      await expect(service.create(validDto(), accountant)).rejects.toBeInstanceOf(ConflictException);
    });

    it('reconciliation_date là tương lai → BadRequestException', async () => {
      await expect(service.create({ ...validDto(), reconciliation_date: futureDate() }, accountant)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('cod_cash_held âm → BadRequestException', async () => {
      await expect(service.create({ ...validDto(), cod_cash_held: -1 }, accountant)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('filter theo hub_id, status, date range', async () => {
      const qb = new MockQb();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      reconciliations.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({ hub_id: 10, remittance_status: RemittanceStatus.PENDING, date_from: '2026-05-01', date_to: '2026-05-31' }, accountant);
      expect(qb.andWhere).toHaveBeenCalledWith('reconciliation.hub_id = :hubId', { hubId: '10' });
      expect(qb.andWhere).toHaveBeenCalledWith('reconciliation.remittance_status = :status', { status: RemittanceStatus.PENDING });
    });

    it('MANAGER thấy tất cả', async () => {
      const qb = new MockQb();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      reconciliations.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({}, manager);
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('ACCOUNTANT thấy tất cả', async () => {
      const qb = new MockQb();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      reconciliations.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({}, accountant);
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('role khác chỉ thấy hub mình', async () => {
      const qb = new MockQb();
      qb.getManyAndCount.mockResolvedValue([[], 0]);
      reconciliations.createQueryBuilder.mockReturnValue(qb);
      await service.findAll({}, driver);
      expect(qb.andWhere).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('update thành công khi PENDING', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ id: '1', remittance_status: RemittanceStatus.PENDING } as any);
      await expect(service.update('1', { cod_cash_held: 1, cc_cash_held: 2, total_remitted: 3 }, accountant)).resolves.toMatchObject({ cod_cash_held: '1', cc_cash_held: '2', total_remitted: '3' });
    });

    it('status không phải PENDING → BadRequestException', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ remittance_status: RemittanceStatus.REMITTED } as any);
      await expect(service.update('1', {}, accountant)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('số tiền âm → BadRequestException', async () => {
      await expect(service.update('1', { cod_cash_held: -1 }, accountant)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('remit', () => {
    it('chuyển PENDING → REMITTED thành công', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ remittance_status: RemittanceStatus.PENDING, total_remitted: '10' } as any);
      await expect(service.remit('1', { remitted_at: '2026-05-26T00:00:00.000Z' }, accountant)).resolves.toMatchObject({ remittance_status: RemittanceStatus.REMITTED });
    });

    it('chuyển OVERDUE → REMITTED thành công', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ remittance_status: RemittanceStatus.OVERDUE, total_remitted: '10' } as any);
      await expect(service.remit('1', {}, accountant)).resolves.toMatchObject({ remittance_status: RemittanceStatus.REMITTED });
    });

    it('remitted_at = now() nếu không truyền', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ remittance_status: RemittanceStatus.PENDING, total_remitted: '10', remitted_at: null } as any);
      const result = await service.remit('1', {}, accountant);
      expect(result.remitted_at).toBeInstanceOf(Date);
    });

    it('status đã REMITTED → BadRequestException', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ remittance_status: RemittanceStatus.REMITTED, total_remitted: '10' } as any);
      await expect(service.remit('1', {}, accountant)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('total_remitted = 0 → BadRequestException', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ remittance_status: RemittanceStatus.PENDING, total_remitted: '0' } as any);
      await expect(service.remit('1', {}, accountant)).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('markOverdue', () => {
    it('cập nhật đúng các reconciliation PENDING quá hạn', async () => {
      reconciliations.find.mockResolvedValue([{ id: '1', remittance_status: RemittanceStatus.PENDING }]);
      await service.markOverdue(manager);
      expect(reconciliations.save).toHaveBeenCalledWith([expect.objectContaining({ remittance_status: RemittanceStatus.OVERDUE })]);
    });

    it('trả về updated_count đúng', async () => {
      reconciliations.find.mockResolvedValue([{ id: '1' }, { id: '2' }]);
      await expect(service.markOverdue(manager)).resolves.toEqual({ updated_count: 2 });
    });

    it('ACCOUNTANT gọi → ForbiddenException', async () => {
      await expect(service.markOverdue(accountant)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getHubSummary', () => {
    it('tổng hợp đúng COD/CC pending và remitted', async () => {
      hubs.findOne.mockResolvedValue({ id: '10', name: 'HAN' });
      const month = new Date().toISOString().slice(0, 7);
      reconciliations.find.mockResolvedValue([
        { remittance_status: RemittanceStatus.PENDING, cod_cash_held: '10', cc_cash_held: '5', total_remitted: '0', reconciliation_date: `${month}-01` },
        { remittance_status: RemittanceStatus.OVERDUE, cod_cash_held: '20', cc_cash_held: '7', total_remitted: '0', reconciliation_date: `${month}-02` },
        { remittance_status: RemittanceStatus.REMITTED, cod_cash_held: '0', cc_cash_held: '0', total_remitted: '30', reconciliation_date: `${month}-03` },
      ]);
      await expect(service.getHubSummary('10', accountant)).resolves.toMatchObject({ pending_cod: 30, pending_cc: 12, remitted_this_month: 30 });
    });

    it('đếm đúng overdue_count', async () => {
      hubs.findOne.mockResolvedValue({ id: '10', name: 'HAN' });
      reconciliations.find.mockResolvedValue([{ remittance_status: RemittanceStatus.OVERDUE, cod_cash_held: '0', cc_cash_held: '0', total_remitted: '0', reconciliation_date: today() }]);
      await expect(service.getHubSummary('10', accountant)).resolves.toMatchObject({ overdue_count: 1 });
    });

    it('hub không tồn tại → NotFoundException', async () => {
      hubs.findOne.mockResolvedValue(null);
      await expect(service.getHubSummary('10', accountant)).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('DIRECTOR xóa thành công khi PENDING', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ remittance_status: RemittanceStatus.PENDING } as any);
      await service.remove('1', director);
      expect(reconciliations.remove).toHaveBeenCalled();
    });

    it('status = REMITTED → BadRequestException', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue({ remittance_status: RemittanceStatus.REMITTED } as any);
      await expect(service.remove('1', director)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('ACCOUNTANT xóa → ForbiddenException', async () => {
      await expect(service.remove('1', accountant)).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
