import { Module } from '@nestjs/common';
import { TimekeepingService } from './timekeeping.service';
import { TimekeepingController } from './timekeeping.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TimekeepingController],
  providers: [TimekeepingService],
})
export class TimekeepingModule {}

