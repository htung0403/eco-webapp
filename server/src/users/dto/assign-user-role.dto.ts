import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class AssignUserRoleDto {
  @ApiProperty({ example: 7 })
  @IsInt()
  role_mask: number;
}
