import { Controller, Get, Query, Param } from '@nestjs/common';
import { OrganizationService } from './organization.service';

@Controller('addresses')
export class AddressesController {
  constructor(private service: OrganizationService) {}

  @Get('regions')
  getRegions() { return this.service.getRegions(); }

  @Get('provinces')
  getProvinces(@Query('regionId') regionId?: string) { 
    return this.service.getProvinces(regionId ? parseInt(regionId) : undefined); 
  }

  @Get('provinces/:code')
  getProvince(@Param('code') code: string) { 
    return this.service.getProvince(BigInt(code)); 
  }

  @Get('administrative-units')
  getAdministrativeUnits() { return this.service.getAdministrativeUnits(); }

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

  @Get('hierarchy')
  getAddressHierarchy(
    @Query('provinceCode') provinceCode: string,
    @Query('wardCode') wardCode: string
  ) {
    return this.service.getAddressHierarchy(BigInt(provinceCode), BigInt(wardCode));
  }
}