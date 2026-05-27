import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { HubEntity } from '../hubs/hub.entity';
import { UserEntity } from './user.entity';

@Entity('user_hubs')
export class UserHubEntity {
  @PrimaryColumn({ type: 'bigint' })
  user_id: string;

  @PrimaryColumn({ type: 'bigint' })
  hub_id: string;

  @ManyToOne(() => UserEntity, (user) => user.user_hubs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => HubEntity, (hub) => hub.user_hubs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hub_id' })
  hub: HubEntity;
}
