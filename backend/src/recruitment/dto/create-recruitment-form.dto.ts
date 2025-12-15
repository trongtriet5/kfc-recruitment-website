import { IsString, IsEnum, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Brand } from '@prisma/client';
import { CreateFormFieldDto } from './create-form-field.dto';

export class CreateRecruitmentFormDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(Brand)
  brand: Brand;

  @IsString()
  source: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  formTitle?: string;

  @IsOptional()
  @IsString()
  formContent?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  // UI customization
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @IsOptional()
  @IsString()
  secondaryColor?: string;

  @IsOptional()
  @IsString()
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  textColor?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Dynamic form fields
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFormFieldDto)
  fields?: CreateFormFieldDto[];
}

