import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { TripEntity } from '../trips/trip.entity';
import { UserEntity } from '../users/user.entity';

@Entity('trucks')
export class TruckEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', unique: true })
  license_plate: string;

  @Column({ type: 'double precision' })
  payload: number;

  @Column({ type: 'bigint', nullable: true })
  driver_id: string | null;

  @Column({ type: 'double precision' })
  fuel_consumption_limit: number;

  @Column({ type: 'varchar' })
  status: string;

  @ManyToOne(() => UserEntity, (user) => user.trucks, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: UserEntity | null;

  @OneToMany(() => TripEntity, (trip) => trip.truck)
  trips: TripEntity[];
}
