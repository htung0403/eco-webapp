import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TripEntity } from '../trips/trip.entity';

@Entity('expenses')
export class ExpenseEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'bigint' })
  trip_id: string;

  @ManyToOne(() => TripEntity, (trip) => trip.expenses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: TripEntity;
}
