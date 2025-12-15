import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RequestsService } from './requests.service';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestDto } from './dto/update-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '@prisma/client';

@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Post()
  create(@Body() createRequestDto: CreateRequestDto, @CurrentUser() user: User) {
    return this.requestsService.create(createRequestDto, user);
  }

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('typeId') typeId?: string,
    @Query('statusId') statusId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.requestsService.findAll(user, {
      typeId,
      statusId,
      employeeId,
      departmentId,
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
    });
  }

  @Get('dashboard')
  getDashboard(
    @CurrentUser() user: User,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.requestsService.getDashboard(user, {
      month: month ? parseInt(month) : undefined,
      year: year ? parseInt(year) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.requestsService.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRequestDto: UpdateRequestDto,
    @CurrentUser() user: User,
  ) {
    return this.requestsService.update(id, updateRequestDto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.requestsService.remove(id, user);
  }
}

