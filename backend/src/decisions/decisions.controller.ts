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
import { DecisionsService } from './decisions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '@prisma/client';
import { CreateDecisionDto } from './dto/create-decision.dto';
import { UpdateDecisionDto } from './dto/update-decision.dto';

@Controller('decisions')
@UseGuards(JwtAuthGuard)
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Get()
  findAll(
    @CurrentUser() user: User,
    @Query('employeeId') employeeId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.decisionsService.findAll(user, { employeeId, type, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.decisionsService.findOne(id, user);
  }

  @Post()
  create(@Body() createDto: CreateDecisionDto, @CurrentUser() user: User) {
    return this.decisionsService.create(createDto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateDecisionDto,
    @CurrentUser() user: User,
  ) {
    return this.decisionsService.update(id, updateDto, user);
  }
}
