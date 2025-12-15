import {
  IsString,
  IsOptional,
} from 'class-validator';

export class UpdateDecisionDto {
  @IsOptional()
  @IsString()
  statusId?: string; // Type ID for decision status

  @IsOptional()
  @IsString()
  fileUrl?: string;
}

