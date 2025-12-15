import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTypeCategoryDto {
  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  module: string; // EMPLOYEE, REQUEST, CONTRACT, DECISION, CANDIDATE, etc.

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

