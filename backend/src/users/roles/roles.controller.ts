
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Permissions } from '../../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
// import { RolesGuard } from '../../auth/guards/roles.guard'; // Add if needed
// import { Roles } from '../../auth/decorators/roles.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  findAll() {
    return this.rolesService.findAll();
  }

  @Get('permissions/metadata')
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  getPermissionsMetadata() {
    return this.rolesService.getAllPermissionMetadata();
  }

  @Get(':id')
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  create(@Body() data: { name: string; code: string; description?: string; permissions: string[] }) {
    return this.rolesService.create(data);
  }

  @Patch(':id')
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  update(@Param('id') id: string, @Body() data: { name?: string; description?: string; permissions?: string[]; isActive?: boolean }) {
    return this.rolesService.update(id, data);
  }

  @Delete(':id')
  @Permissions('USER_MANAGE')
  @UseGuards(PermissionsGuard)
  remove(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }
}
