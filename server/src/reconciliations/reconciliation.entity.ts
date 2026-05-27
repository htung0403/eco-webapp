import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RemittanceStatus } from '../common/enums';
import { HubEntity } from '../hubs/hub.entity';

@Entity('reconciliations')
export class ReconciliationEntity {
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

  @ManyToOne(() => HubEntity, (hub) => hub.reconciliations)
  @JoinColumn({ name: 'hub_id' })
  hub: HubEntity;
}
