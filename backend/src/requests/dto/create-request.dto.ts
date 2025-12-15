import {
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
} from 'class-validator';

export class CreateRequestDto {
  @IsString()
  typeId: string; // Type ID for request type

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Leave specific
  @IsOptional()
  @IsString()
  leaveTypeId?: string; // Type ID for leave type

  @IsOptional()
  @IsNumber()
  leaveDays?: number;

  // Overtime specific
  @IsOptional()
  @IsNumber()
  overtimeHours?: number;

  @IsOptional()
  @IsDateString()
  overtimeDate?: string;

  // Check-in/out confirmation
  @IsOptional()
  @IsDateString()
  checkInTime?: string;

  @IsOptional()
  @IsDateString()
  checkOutTime?: string;

  // Shift change
  @IsOptional()
  @IsString()
  fromShift?: string;

  @IsOptional()
  @IsString()
  toShift?: string;

  @IsOptional()
  @IsDateString()
  shiftDate?: string;

  // Business trip
  @IsOptional()
  @IsString()
  tripLocation?: string;

  @IsOptional()
  @IsString()
  tripPurpose?: string;
}

