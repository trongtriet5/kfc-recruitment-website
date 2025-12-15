import { IsString, IsInt, Min, Max } from 'class-validator';

export class CalculatePayrollDto {
  @IsString()
  employeeId: string;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  year: number;
}

