import { Module } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { RecruitmentController } from './recruitment.controller';
import { TypesController } from './types.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StatusTransitionService } from './status-transition.service';
import { AuditService } from './audit.service';
import { ProposalService } from './proposal.service';
import { CampaignFulfillmentService } from './campaign-fulfillment.service';

@Module({
  imports: [PrismaModule],
  controllers: [RecruitmentController, TypesController],
  providers: [
    RecruitmentService,
    StatusTransitionService,
    AuditService,
    ProposalService,
    CampaignFulfillmentService,
  ],
  exports: [
    RecruitmentService,
    StatusTransitionService,
    AuditService,
    ProposalService,
    CampaignFulfillmentService,
  ],
})
export class RecruitmentModule {}

