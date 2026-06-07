import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('fund_balances')
export class FundBalanceEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'date' })
  record_date: string;

  @Column({ type: 'varchar' })
  fund_code: string;

  @Column({ type: 'varchar' })
  fund_name: string;

  @Column({ type: 'varchar', nullable: true })
  hub_name: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  balance_amount: string;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
