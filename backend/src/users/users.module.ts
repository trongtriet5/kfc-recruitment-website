import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RolesModule } from './roles/roles.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, RolesModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, RolesModule],
})
export class UsersModule {}
