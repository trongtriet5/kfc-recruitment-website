import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '@prisma/client';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { ConvertCandidateToEmployeeDto } from './dto/convert-candidate-to-employee.dto';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('statusId') statusId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('positionId') positionId?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.employeesService.findAll(user, {
      statusId,
      departmentId,
      positionId,
      storeId,
    });
  }

  @Get('dashboard')
  getDashboard(@CurrentUser() user: User) {
    return this.employeesService.getDashboard(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.employeesService.findOne(id, user);
  }

  @Post()
  create(@Body() createDto: CreateEmployeeDto, @CurrentUser() user: User) {
    return this.employeesService.create(createDto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEmployeeDto,
    @CurrentUser() user: User,
  ) {
    return this.employeesService.update(id, updateDto, user);
  }

  @Post('convert-from-candidate')
  convertFromCandidate(
    @Body() convertDto: ConvertCandidateToEmployeeDto,
    @CurrentUser() user: User,
  ) {
    return this.employeesService.convertCandidateToEmployee(convertDto, user);
  }

  @Get('generate-code')
  async generateEmployeeCode(@CurrentUser() user: User) {
    const code = await this.employeesService.generateEmployeeCode();
    return { employeeCode: code };
  }
}
