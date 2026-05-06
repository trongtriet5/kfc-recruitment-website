import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

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
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  createStore(@Body() data: any) { return this.service.createStore(data); }
  
  @Patch(':id')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  updateStore(@Param('id') id: string, @Body() data: any) { 
    return this.service.updateStore(id, data); 
  }
  
  @Delete(':id')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  deleteStore(@Param('id') id: string) { return this.service.deleteStore(id); }

  @Post('import')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  importStores(@Body() data: any) { return this.service.importStore(data); }

  // Administrative Regions
  @Get('regions')
  getRegions() { return this.service.getRegions(); }

  // Provinces
  @Get('provinces')
  getProvinces() { 
    return this.service.getProvinces(); 
  }

  @Get('provinces/:code')
  getProvince(@Param('code') code: string) { 
    return this.service.getProvince(code); 
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
      provinceCode,
      unitId ? parseInt(unitId) : undefined
    ); 
  }

  @Get('wards/:code')
  getWard(@Param('code') code: string) { 
    return this.service.getWard(code); 
  }

  // Address hierarchy
  @Get('address-hierarchy')
  getAddressHierarchy(
    @Query('provinceCode') provinceCode: string,
    @Query('wardCode') wardCode: string
  ) {
    return this.service.getAddressHierarchy(provinceCode, wardCode);
  }
}

@Controller('organization')
@UseGuards(JwtAuthGuard)
export class OrganizationController {
  constructor(private service: OrganizationService) {}


  @Get('positions')
  getPositions() { return this.service.getPositions(); }
  
  @Post('positions')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  createPosition(@Body() data: any) { return this.service.createPosition(data); }
  
  @Patch('positions/:id')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  updatePosition(@Param('id') id: string, @Body() data: any) { return this.service.updatePosition(id, data); }
  
  @Delete('positions/:id')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  deletePosition(@Param('id') id: string) { return this.service.deletePosition(id); }
}
