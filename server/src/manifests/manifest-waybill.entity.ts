import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ManifestEntity } from './manifest.entity';
import { WaybillEntity } from '../waybills/waybill.entity';

@Entity('manifest_waybills')
export class ManifestWaybillEntity {
  @PrimaryColumn({ type: 'bigint' })
  manifest_id: string;

  @PrimaryColumn({ type: 'bigint' })
  waybill_id: string;

  @ManyToOne(() => ManifestEntity, (manifest) => manifest.manifest_waybills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'manifest_id' })
  manifest: ManifestEntity;

  @ManyToOne(() => WaybillEntity, (waybill) => waybill.manifest_waybills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'waybill_id' })
  waybill: WaybillEntity;
}
