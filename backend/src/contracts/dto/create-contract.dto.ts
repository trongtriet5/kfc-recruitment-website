import {
  IsString,
  IsDateString,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateContractDto {
  @IsString()
  employeeId: string;

  @IsString()
  typeId: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsNumber()
  salary: number;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  fileUrl?: string;
}

