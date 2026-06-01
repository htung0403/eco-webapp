import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('vehicle_directory')
export class VehicleDirectoryEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar' })
  driver_name: string;

  @Column({ type: 'varchar' })
  region: string;

  @Column({ type: 'varchar' })
  carrier_name: string;

  @Column({ type: 'varchar', unique: true })
  license_plate: string;

  @Column({ type: 'varchar' })
  vehicle_type: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

@Entity('vehicle_costs')
export class VehicleCostEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'date' })
  cost_date: string;

  @Column({ type: 'varchar' })
  license_plate: string;

  @Column({ type: 'varchar' })
  vehicle_type: string;

  @Column({ type: 'varchar' })
  cost_type: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  amount: string;

  @Column({ type: 'varchar' })
  status: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

@Entity('cash_transaction_details')
export class CashTransactionDetailEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  vehicle_cost_id: string;

  @Column({ type: 'varchar' })
  voucher_type: string;

  @Column({ type: 'varchar' })
  voucher_name: string;

  @Column({ type: 'varchar' })
  service_type: string;

  @Column({ type: 'varchar' })
  counterparty_unit: string;

  @Column({ type: 'varchar' })
  content: string;

  @Column({ type: 'varchar' })
  performed_by: string;

  @Column({ type: 'date' })
  entry_date: string;

  @Column({ type: 'time' })
  entry_time: string;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  amount: string;

  @ManyToOne(() => VehicleCostEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_cost_id' })
  vehicle_cost: VehicleCostEntity;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

@Entity('north_south_shipments')
export class NorthSouthShipmentEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar' })
  bill: string;

  @Column({ type: 'varchar' })
  goods_name: string;

  @Column({ type: 'integer', default: 0 })
  package_count: number;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  volume: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  weight: string;

  @Column({ type: 'varchar' })
  service_type: string;

  @Column({ type: 'varchar' })
  destination: string;

  @Column({ type: 'varchar' })
  address: string;

  @Column({ type: 'varchar' })
  unit: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  unit_price: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  transfer_fee: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  total_amount: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  cod_amount: string;

  @Column({ type: 'varchar' })
  payment_method: string;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @Column({ type: 'varchar', nullable: true })
  pickup_vehicle_status: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  external_vehicle_cost: string;

  @Column({ type: 'varchar', nullable: true })
  external_vehicle_payment_method: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  customer_discount: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  final_profit: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  carrier_holding_amount: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

@Entity('staff_members')
export class StaffMemberEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar' })
  full_name: string;

  @Column({ type: 'varchar' })
  department: string;

  @Column({ type: 'varchar' })
  position: string;

  @Column({ type: 'varchar', unique: true })
  phone: string;

  @Column({ type: 'varchar' })
  password_hash: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

@Entity('carrier_directory')
export class CarrierDirectoryEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar' })
  region: string;

  @Column({ type: 'varchar' })
  carrier_name: string;

  @Column({ type: 'varchar' })
  license_plate: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

@Entity('chanh_shipments')
export class ChanhShipmentEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar' })
  province_code: string;

  @Column({ type: 'integer', default: 0 })
  bill_count: number;

  @Column({ type: 'varchar' })
  company_name: string;

  @Column({ type: 'varchar' })
  goods_name: string;

  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 })
  quantity: string;

  @Column({ type: 'varchar' })
  goods_type: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  unit_price: string;

  @Column({ type: 'varchar' })
  cost_type: string;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @Column({ type: 'varchar' })
  carrier_name: string;

  @Column({ type: 'varchar' })
  license_plate: string;

  @Column({ type: 'date' })
  shipment_date: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  bo_fee: string;

  @Column({ type: 'varchar' })
  bill: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

@Entity('customer_directory')
export class CustomerDirectoryEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar' })
  full_name: string;

  @Column({ type: 'varchar' })
  phone: string;

  @Column({ type: 'varchar' })
  address: string;

  @Column({ type: 'varchar', unique: true })
  customer_code: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

@Entity('cash_journal_entries')
export class CashJournalEntryEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'date' })
  entry_date: string;

  @Column({ type: 'varchar' })
  voucher_type: string;

  @Column({ type: 'varchar' })
  source: string;

  @Column({ type: 'varchar' })
  cost_category: string;

  @Column({ type: 'varchar' })
  detail: string;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @Column({ type: 'varchar' })
  content: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  income_amount: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  expense_amount: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

@Entity('warehouses')
export class WarehouseEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar' })
  warehouse_name: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}

export const businessTableEntities = [
  VehicleDirectoryEntity,
  VehicleCostEntity,
  CashTransactionDetailEntity,
  NorthSouthShipmentEntity,
  StaffMemberEntity,
  CarrierDirectoryEntity,
  ChanhShipmentEntity,
  CustomerDirectoryEntity,
  CashJournalEntryEntity,
  WarehouseEntity,
];
