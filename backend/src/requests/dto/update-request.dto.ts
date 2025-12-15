import { IsString, IsOptional, IsDateString, IsNumber } from 'class-validator';

export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  statusId?: string; // Type ID for request status

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  // Allow user to update request fields (only when status is PENDING)
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
  leaveTypeId?: string;

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

