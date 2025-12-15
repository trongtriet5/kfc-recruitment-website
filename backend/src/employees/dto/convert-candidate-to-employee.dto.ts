import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { Gender, Education, Brand } from '@prisma/client';

export class ConvertCandidateToEmployeeDto {
  @IsString()
  candidateId: string;

  @IsString()
  employeeCode: string;

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

  @IsOptional()
  @IsString()
  address?: string; // Full address if not using candidate's address fields
}

