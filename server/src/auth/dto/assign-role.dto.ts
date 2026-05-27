import { IsInt, Max, Min } from 'class-validator';

export class AssignRoleDto {
  @IsInt()
  @Min(1)
  @Max(127)
  role_mask: number;
}
