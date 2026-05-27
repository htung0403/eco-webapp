import { IsEmail, IsInt, IsOptional, IsPhoneNumber, IsString, Max, Min, MinLength } from 'class-validator';

export class RegisterUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(2)
  full_name: string;

  @IsPhoneNumber('VN')
  phone: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(127)
  role_mask?: number;

  @IsOptional()
  @IsString()
  hub_id?: string;
}
