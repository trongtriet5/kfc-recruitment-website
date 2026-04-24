import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { LocationService } from './location.service';
import { OrganizationController } from './organization.controller';
import { StoresController } from './organization.controller';
import { AddressesController } from './addresses.controller';
import { LocationController } from './location.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizationController, StoresController, AddressesController, LocationController],
  providers: [OrganizationService, LocationService],
  exports: [OrganizationService, LocationService],
})
export class OrganizationModule {}

