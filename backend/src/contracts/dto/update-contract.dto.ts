import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  statusId?: string; // Type ID for contract status

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsNumber()
  salary?: number;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}

