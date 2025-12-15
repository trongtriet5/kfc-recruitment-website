import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsEmail,
} from 'class-validator';
import { Gender, Education, Brand } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString()
  employeeCode: string;

  @IsString()
  fullName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  phone: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  idCard?: string;

  @IsEnum(Education)
  education: Education;

  @IsOptional()
  @IsString()
  statusId?: string; // Type ID for employee status

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  positionId?: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsEnum(Brand)
  brand?: Brand;

  @IsOptional()
  @IsString()
  contractTypeId?: string; // Type ID for contract type

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  salary?: number;

  @IsOptional()
  @IsString()
  insuranceNumber?: string;
}

