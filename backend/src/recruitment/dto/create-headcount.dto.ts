import { IsString, IsOptional, IsInt, Min, IsEnum, IsArray } from 'class-validator';
import { HeadcountPeriod } from '@prisma/client';

export class CreateHeadcountDto {
  @IsString()
  name: string;

  @IsEnum(HeadcountPeriod)
  period: HeadcountPeriod;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsArray()
  @IsString({ each: true })
  positionIds: string[];

  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  currents: number[];

  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  targets: number[];

  @IsInt()
  year: number;

  @IsOptional()
  @IsInt()
  month?: number;
}

