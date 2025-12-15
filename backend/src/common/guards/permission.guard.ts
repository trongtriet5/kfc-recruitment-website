import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { hasPermission } from '../permissions/permissions';

export const PERMISSION_KEY = 'permission';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permission) {
      return true; // No permission required
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const hasAccess = hasPermission(user.role as UserRole, permission as any);
    if (!hasAccess) {
      throw new ForbiddenException(`You don't have permission to perform this action`);
    }

    return true;
  }
}

