import { IsOptional, IsPhoneNumber, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  full_name?: string;

  @IsOptional()
  @IsPhoneNumber('VN')
  phone?: string;
}
