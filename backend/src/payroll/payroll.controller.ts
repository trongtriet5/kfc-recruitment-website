import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { PayrollService } from './payroll.service';
import { CalculatePayrollDto } from './dto/calculate-payroll.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('payroll')
@UseGuards(JwtAuthGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('employeeId') employeeId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('statusId') statusId?: string,
  ) {
    return this.payrollService.findAll(user, {
      employeeId,
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
      statusId,
    });
  }

  @Post('calculate')
  calculate(@Body() dto: CalculatePayrollDto, @CurrentUser() user: User) {
    return this.payrollService.calculate(dto.employeeId, dto.month, dto.year, user);
  }
}

