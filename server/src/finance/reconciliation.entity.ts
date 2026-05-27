import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { RemittanceStatus } from '../common/enums';
import { HubEntity } from '../hubs/hub.entity';

@Entity('reconciliations')
@Unique('UQ_reconciliations_hub_date', ['hub_id', 'reconciliation_date'])
export class FinanceReconciliationEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  hub_id: string;

  @Column({ type: 'date' })
  reconciliation_date: string;

  @Column({ type: 'decimal' })
  cod_cash_held: string;

  @Column({ type: 'decimal' })
  cc_cash_held: string;

  @Column({ type: 'decimal' })
  total_remitted: string;

  @Column({ type: 'enum', enum: RemittanceStatus, default: RemittanceStatus.PENDING })
  remittance_status: RemittanceStatus;


  @Column({ type: 'timestamp', nullable: true })
  remitted_at: Date | null;

  @ManyToOne(() => HubEntity)
  @JoinColumn({ name: 'hub_id' })
  hub: HubEntity;

}

