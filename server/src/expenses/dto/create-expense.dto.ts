import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt } from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  trip_id: number;
}
