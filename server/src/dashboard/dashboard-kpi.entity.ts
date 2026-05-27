import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('dashboard_kpis')
export class DashboardKpiEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'date' })
  kpi_date: string;

  @Column({ type: 'bigint', nullable: true })
  hub_id: string | null;

  @Column({ type: 'varchar' })
  metric_key: string;

  @Column({ type: 'decimal', default: 0 })
  metric_value: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
