import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../rbac.service';
import { PermissionAction } from '../../recruitment/constraints';
import { normalizeRole } from '../role-utils';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.get<PermissionAction[]>('permissions', context.getHandler());
    if (!permissions || permissions.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) return false;

    const role = normalizeRole(user.role);
    if (!role) return false;

    // Admin has all permissions
    if (role === 'ADMIN') return true;

    // Check if user has ANY of the required permissions
    for (const permission of permissions) {
      const hasPerm = await this.rbacService.hasPermission(user.id, role, permission);
      if (hasPerm) return true;
    }

    return false;
  }
}
