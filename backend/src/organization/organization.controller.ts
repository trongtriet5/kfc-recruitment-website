import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('organization')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private service: OrganizationService) {}

  // Departments
  @Get('departments')
  getDepartments() { return this.service.getDepartments(); }
  
  @Post('departments')
  createDepartment(@Body() data: any) { return this.service.createDepartment(data); }
  
  @Patch('departments/:id')
  updateDepartment(@Param('id') id: string, @Body() data: any) { return this.service.updateDepartment(id, data); }
  
  @Delete('departments/:id')
  deleteDepartment(@Param('id') id: string) { return this.service.deleteDepartment(id); }

  // Positions
  @Get('positions')
  getPositions() { return this.service.getPositions(); }
  
  @Post('positions')
  createPosition(@Body() data: any) { return this.service.createPosition(data); }
  
  @Patch('positions/:id')
  updatePosition(@Param('id') id: string, @Body() data: any) { return this.service.updatePosition(id, data); }
  
  @Delete('positions/:id')
  deletePosition(@Param('id') id: string) { return this.service.deletePosition(id); }

  // Stores
  @Get('stores')
  getStores() { return this.service.getStores(); }
  
  @Get('stores/:id')
  getStore(@Param('id') id: string) { return this.service.getStore(id); }
  
  @Post('stores')
  createStore(@Body() data: any) { return this.service.createStore(data); }
  
  @Patch('stores/:id')
  updateStore(@Param('id') id: string, @Body() data: any) { return this.service.updateStore(id, data); }
  
  @Delete('stores/:id')
  deleteStore(@Param('id') id: string) { return this.service.deleteStore(id); }
}