import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckInOutDto {
  @IsEnum(['CHECKIN', 'CHECKOUT'])
  type: 'CHECKIN' | 'CHECKOUT';

  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;

  @IsOptional()
  @IsString()
  date?: string;
}

