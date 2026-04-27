import { Module } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { RecruitmentController } from './recruitment.controller';
import { TypesController } from './types.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StatusTransitionService } from './status-transition.service';
import { AuditService } from './audit.service';
import { ProposalService } from './proposal.service';
import { CampaignFulfillmentService } from './campaign-fulfillment.service';
import { CandidateReadService } from './candidate-read.service';
import { CandidateWriteService } from './candidate-write.service';
import { CampaignService } from './campaign.service';

@Module({
  imports: [PrismaModule],
  controllers: [RecruitmentController, TypesController],
  providers: [
    RecruitmentService,
    StatusTransitionService,
    AuditService,
    ProposalService,
    CampaignFulfillmentService,
    CandidateReadService,
    CandidateWriteService,
    CampaignService,
  ],
  exports: [
    RecruitmentService,
    StatusTransitionService,
    AuditService,
    ProposalService,
    CampaignFulfillmentService,
    CandidateReadService,
    CandidateWriteService,
    CampaignService,
  ],
})
export class RecruitmentModule {}

