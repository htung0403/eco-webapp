import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/roles';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { RequireRoles } from './decorators/require-roles.decorator';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersService } from './users.service';
import { UserEntity } from '../users/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an internal employee account' })
  register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue a new access token from a valid refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke current refresh token' })
  logout(@CurrentUser() user: UserEntity) {
    return this.authService.logout(user.id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  me(@CurrentUser() user: UserEntity) {
    return user;
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current authenticated user profile' })
  updateProfile(@CurrentUser() user: UserEntity, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current authenticated user password' })
  changePassword(@CurrentUser() user: UserEntity, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Patch('users/:id/role')
  @ApiTags('Users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign role bitmask to an internal employee' })
  assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto, @CurrentUser() user: UserEntity) {
    return this.usersService.assignRole(id, dto.role_mask, user);
  }

  @Patch('users/:id/deactivate')
  @ApiTags('Users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoles(Roles.MANAGER, Roles.DIRECTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate an internal employee account' })
  deactivateUser(@Param('id') id: string, @CurrentUser() user: UserEntity) {
    return this.usersService.deactivateUser(id, user);
  }
}
