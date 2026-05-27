import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserEntity } from '../../users/user.entity';
import { REQUIRED_ROLES_KEY } from '../decorators/require-roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<number[]>(REQUIRED_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: UserEntity }>();
    const user = request.user;

    if (!user || !requiredRoles.some((role) => (user.role_mask & role) !== 0)) {
      throw new ForbiddenException('Insufficient role permissions');
    }

    return true;
  }
}
