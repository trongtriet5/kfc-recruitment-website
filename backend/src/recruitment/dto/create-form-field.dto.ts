import { IsString, IsEnum, IsOptional, IsBoolean, IsInt, IsArray, Min, Max } from 'class-validator';
import { FormFieldType } from '@prisma/client';

export class CreateFormFieldDto {
  @IsString()
  name: string;

  @IsString()
  label: string;

  @IsEnum(FormFieldType)
  type: FormFieldType;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsArray()
  options?: Array<{ value: string; label: string }>;

  @IsOptional()
  @IsInt()
  @Min(0)
  minLength?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxLength?: number;

  @IsOptional()
  @IsString()
  pattern?: string;

  @IsOptional()
  @IsString()
  width?: string;

  @IsOptional()
  @IsString()
  helpText?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

