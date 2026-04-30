import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { CandidateWriteService } from './candidate-write.service';

@Controller('recruitment')
export class RecruitmentPublicController {
  constructor(
    private service: RecruitmentService,
    private candidateWriteService: CandidateWriteService,
  ) {}

  @Get('forms/link/:link')
  getFormByLink(@Param('link') link: string) {
    return this.service.getFormByLink(decodeURIComponent(link));
  }

  @Get('campaigns/link/:link')
  getCampaignByLink(@Param('link') link: string) {
    return this.service.getCampaignByLink(decodeURIComponent(link));
  }

  @Post('apply')
  apply(@Body() data: any) {
    return this.candidateWriteService.createCandidate(data);
  }

  @Get('public/stores')
  getPublicStores() {
    return this.service.getPublicStores();
  }

  @Get('public/positions')
  getPublicPositions() {
    return this.service.getPublicPositions();
  }
}
