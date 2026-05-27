import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignManifestTripDto {
  @ApiProperty({ example: '10' })
  @IsString()
  @IsNotEmpty()
  trip_id: string;
}
