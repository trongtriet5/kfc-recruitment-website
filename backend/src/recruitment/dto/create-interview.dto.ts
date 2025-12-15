import { IsString, IsDateString, IsOptional } from 'class-validator';

export class CreateInterviewDto {
  @IsString()
  candidateId: string;

  @IsString()
  interviewerId: string;

  @IsString()
  typeId: string; // Type ID for interview type

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  resultId?: string; // Type ID for interview result
}

