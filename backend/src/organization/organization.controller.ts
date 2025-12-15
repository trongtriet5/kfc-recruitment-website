import { Controller, Get, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller()
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('departments')
  getDepartments(@CurrentUser() user: User) {
    return this.organizationService.getDepartments();
  }

  @Get('positions')
  getPositions(@CurrentUser() user: User) {
    return this.organizationService.getPositions();
  }

  @Get('stores')
  getStores(@CurrentUser() user: User) {
    return this.organizationService.getStores();
  }
}

