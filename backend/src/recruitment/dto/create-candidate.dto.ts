import { IsString, IsOptional, IsEnum } from 'class-validator';
import { Brand } from '@prisma/client';

export class CreateCandidateDto {
  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  cvUrl?: string;

  @IsOptional()
  @IsString()
  formId?: string;

  @IsOptional()
  @IsString()
  campaignId?: string;

  @IsString()
  statusId: string; // Type ID for candidate status

  @IsOptional()
  @IsEnum(Brand)
  brand?: Brand;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

