import { Controller, Get, Param } from '@nestjs/common'
import { LocationService } from './location.service'

@Controller('locations')
export class LocationController {
  constructor(private service: LocationService) {}

  @Get('provinces')
  getProvinces() {
    return this.service.getProvinces()
  }

  @Get('provinces/:provinceId/wards')
  getWardsByProvince(@Param('provinceId') provinceId: string) {
    return this.service.getWardsByProvince(provinceId)
  }

  @Get('provinces/code/:provinceCode/wards')
  getWardsByProvinceCode(@Param('provinceCode') provinceCode: string) {
    return this.service.getWardsByProvinceCode(provinceCode)
  }
}
