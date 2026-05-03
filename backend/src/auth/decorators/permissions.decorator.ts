import { SetMetadata } from '@nestjs/common';
import { PermissionAction } from '../../recruitment/constraints';

export const Permissions = (...permissions: PermissionAction[]) => SetMetadata('permissions', permissions);
