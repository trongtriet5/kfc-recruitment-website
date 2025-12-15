import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { TimekeepingService } from './timekeeping.service';
import { CheckInOutDto } from './dto/checkin-out.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('timekeeping')
@UseGuards(JwtAuthGuard)
export class TimekeepingController {
  constructor(private readonly timekeepingService: TimekeepingService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('employeeId') employeeId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timekeepingService.findAll(user, {
      employeeId,
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      startDate,
      endDate,
    });
  }

  @Post()
  checkInOut(@Body() dto: CheckInOutDto, @CurrentUser() user: User) {
    return this.timekeepingService.checkInOut(
      user,
      dto.type,
      dto.lat,
      dto.lng,
      dto.date,
    );
  }
}

