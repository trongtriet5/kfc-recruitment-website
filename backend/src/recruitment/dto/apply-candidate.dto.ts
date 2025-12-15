import { IsString, IsOptional, IsEmail, IsDateString, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { Gender } from '@prisma/client';

export class ApplyCandidateDto {
  @IsString()
  fullName: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  phone: string;

  @IsDateString()
  dateOfBirth: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  cccd: string;

  // Nơi ở hiện tại
  @IsString()
  currentCity: string;

  @IsString()
  currentDistrict: string;

  @IsString()
  currentWard: string;

  @IsString()
  currentStreet: string;

  // Địa chỉ thường trú
  @IsBoolean()
  permanentSameAsCurrent: boolean;

  @IsOptional()
  @IsString()
  permanentCity?: string;

  @IsOptional()
  @IsString()
  permanentDistrict?: string;

  @IsOptional()
  @IsString()
  permanentWard?: string;

  @IsOptional()
  @IsString()
  permanentStreet?: string;

  // Vị trí ứng tuyển
  @IsString()
  appliedPosition: string;

  @IsOptional()
  @IsString()
  appliedPositionOther?: string;

  @IsDateString()
  availableStartDate: string;

  @IsString()
  preferredWorkShift: string;

  @IsString()
  canWorkTet: string;

  @IsString()
  referrer: string;

  @IsOptional()
  @IsString()
  referrerName?: string;

  @IsArray()
  preferredLocations: string[];

  @IsOptional()
  @IsString()
  workExperience?: string;

  @IsString()
  formId: string;

  @IsOptional()
  @IsString()
  campaignId?: string;
}

