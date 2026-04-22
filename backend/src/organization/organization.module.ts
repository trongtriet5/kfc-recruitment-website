import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { StoresController } from './organization.controller';
import { AddressesController } from './addresses.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrganizationController, StoresController, AddressesController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}

