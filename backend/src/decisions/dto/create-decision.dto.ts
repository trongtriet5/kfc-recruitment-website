import {
  IsString,
  IsDateString,
  IsOptional,
} from 'class-validator';

export class CreateDecisionDto {
  @IsString()
  employeeId: string;

  @IsString()
  typeId: string; // Type ID for decision type

  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsDateString()
  effectiveDate: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}

