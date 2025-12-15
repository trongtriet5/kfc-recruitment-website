import { IsOptional, IsString } from 'class-validator';

export class UpdateProposalDto {
  @IsOptional()
  @IsString()
  statusId?: string; // Type ID for proposal status

  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

