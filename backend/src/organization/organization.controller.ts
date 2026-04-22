import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('stores')
@UseGuards(JwtAuthGuard)
export class StoresController {
  constructor(private service: OrganizationService) {}

  @Get()
  getStores(@CurrentUser() user: any) { 
    return this.service.getStores(user); 
  }
  
  @Get(':id')
  getStore(@Param('id') id: string) { return this.service.getStore(id); }
  
  @Post()
  createStore(@Body() data: any) { return this.service.createStore(data); }
  
  @Patch(':id')
  updateStore(@Param('id') id: string, @Body() data: any) { 
    return this.service.updateStore(id, data); 
  }
  
  @Delete(':id')
  deleteStore(@Param('id') id: string) { return this.service.deleteStore(id); }

  // Administrative Regions
  @Get('regions')
  getRegions() { return this.service.getRegions(); }

  // Provinces
  @Get('provinces')
  getProvinces(@Query('regionId') regionId?: string) { 
    return this.service.getProvinces(regionId ? parseInt(regionId) : undefined); 
  }

  @Get('provinces/:code')
  getProvince(@Param('code') code: string) { 
    return this.service.getProvince(BigInt(code)); 
  }

  // Administrative Units
  @Get('administrative-units')
  getAdministrativeUnits() { return this.service.getAdministrativeUnits(); }

  // Wards
  @Get('wards')
  getWards(
    @Query('provinceCode') provinceCode?: string,
    @Query('unitId') unitId?: string
  ) { 
    return this.service.getWards(
      provinceCode ? BigInt(provinceCode) : undefined,
      unitId ? parseInt(unitId) : undefined
    ); 
  }

  @Get('wards/:code')
  getWard(@Param('code') code: string) { 
    return this.service.getWard(BigInt(code)); 
  }

  // Address hierarchy
  @Get('address-hierarchy')
  getAddressHierarchy(
    @Query('provinceCode') provinceCode: string,
    @Query('wardCode') wardCode: string
  ) {
    return this.service.getAddressHierarchy(BigInt(provinceCode), BigInt(wardCode));
  }
}

@Controller('organization')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private service: OrganizationService) {}

  @Get('departments')
  getDepartments() { return this.service.getDepartments(); }
  
  @Post('departments')
  createDepartment(@Body() data: any) { return this.service.createDepartment(data); }
  
  @Patch('departments/:id')
  updateDepartment(@Param('id') id: string, @Body() data: any) { return this.service.updateDepartment(id, data); }
  
  @Delete('departments/:id')
  deleteDepartment(@Param('id') id: string) { return this.service.deleteDepartment(id); }

  @Get('positions')
  getPositions() { return this.service.getPositions(); }
  
  @Post('positions')
  createPosition(@Body() data: any) { return this.service.createPosition(data); }
  
  @Patch('positions/:id')
  updatePosition(@Param('id') id: string, @Body() data: any) { return this.service.updatePosition(id, data); }
  
  @Delete('positions/:id')
  deletePosition(@Param('id') id: string) { return this.service.deletePosition(id); }
}