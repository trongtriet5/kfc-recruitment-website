import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { User } from '@prisma/client';
import { CreateRecruitmentFormDto } from './dto/create-recruitment-form.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { UpdateCandidateDto } from './dto/update-candidate.dto';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';
import { CreateHeadcountDto } from './dto/create-headcount.dto';
import { ApplyCandidateDto } from './dto/apply-candidate.dto';

@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  // ============ Recruitment Forms ============
  @Post('forms')
  @UseGuards(JwtAuthGuard)
  createForm(@Body() createDto: CreateRecruitmentFormDto, @CurrentUser() user: User) {
    return this.recruitmentService.createForm(createDto, user);
  }

  @Get('forms')
  @UseGuards(JwtAuthGuard)
  getForms(@CurrentUser() user: User) {
    return this.recruitmentService.getForms(user);
  }

  @Get('forms/:id')
  @UseGuards(JwtAuthGuard)
  getForm(@Param('id') id: string, @CurrentUser() user: User) {
    return this.recruitmentService.getForm(id, user);
  }

  @Patch('forms/:id')
  @UseGuards(JwtAuthGuard)
  updateForm(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateRecruitmentFormDto>,
    @CurrentUser() user: User,
  ) {
    return this.recruitmentService.updateForm(id, updateDto, user);
  }

  @Delete('forms/:id')
  @UseGuards(JwtAuthGuard)
  deleteForm(@Param('id') id: string, @CurrentUser() user: User) {
    return this.recruitmentService.deleteForm(id, user);
  }

  // ============ Campaigns ============
  @Post('campaigns')
  @UseGuards(JwtAuthGuard)
  createCampaign(@Body() createDto: CreateCampaignDto, @CurrentUser() user: User) {
    return this.recruitmentService.createCampaign(createDto, user);
  }

  @Get('campaigns')
  @UseGuards(JwtAuthGuard)
  getCampaigns(
    @CurrentUser() user: User,
    @Query('formId') formId?: string,
    @Query('isActive') isActive?: string,
  ) {
    return this.recruitmentService.getCampaigns(user, {
      formId,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    });
  }

  @Get('campaigns/:id')
  @UseGuards(JwtAuthGuard)
  getCampaign(@Param('id') id: string, @CurrentUser() user: User) {
    return this.recruitmentService.getCampaign(id, user);
  }

  @Get('campaigns/statistics')
  @UseGuards(JwtAuthGuard)
  getCampaignStatistics(@Query('campaignId') campaignId?: string) {
    return this.recruitmentService.getCampaignStatistics(campaignId);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  getDashboard(@CurrentUser() user: User) {
    return this.recruitmentService.getDashboard(user);
  }

  // ============ Candidates ============
  @Get('candidates')
  @UseGuards(JwtAuthGuard)
  getCandidates(
    @CurrentUser() user: User,
    @Query('statusId') statusId?: string,
    @Query('campaignId') campaignId?: string,
    @Query('formId') formId?: string,
    @Query('storeId') storeId?: string,
    @Query('brand') brand?: string,
  ) {
    return this.recruitmentService.getCandidates(user, {
      statusId,
      campaignId,
      formId,
      storeId,
      brand,
    });
  }

  @Post('candidates')
  @UseGuards(JwtAuthGuard)
  createCandidate(@Body() createDto: CreateCandidateDto, @CurrentUser() user: User) {
    return this.recruitmentService.createCandidate(createDto, user);
  }

  @Get('candidates/:id')
  @UseGuards(JwtAuthGuard)
  getCandidate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.recruitmentService.getCandidate(id, user);
  }

  @Patch('candidates/:id')
  @UseGuards(JwtAuthGuard)
  updateCandidate(
    @Param('id') id: string,
    @Body() updateDto: UpdateCandidateDto,
    @CurrentUser() user: User,
  ) {
    return this.recruitmentService.updateCandidate(id, updateDto, user);
  }

  @Delete('candidates/:id')
  @UseGuards(JwtAuthGuard)
  deleteCandidate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.recruitmentService.deleteCandidate(id, user);
  }

  // ============ Interviews ============
  @Get('interviews')
  @UseGuards(JwtAuthGuard)
  getInterviews(
    @CurrentUser() user: User,
    @Query('candidateId') candidateId?: string,
    @Query('interviewerId') interviewerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.recruitmentService.getInterviews(user, {
      candidateId,
      interviewerId,
      startDate,
      endDate,
    });
  }

  @Post('interviews')
  @UseGuards(JwtAuthGuard)
  createInterview(@Body() createDto: CreateInterviewDto, @CurrentUser() user: User) {
    return this.recruitmentService.createInterview(createDto, user);
  }

  @Patch('interviews/:id')
  @UseGuards(JwtAuthGuard)
  updateInterview(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateInterviewDto>,
    @CurrentUser() user: User,
  ) {
    return this.recruitmentService.updateInterview(id, updateDto, user);
  }

  // ============ Proposals ============
  @Post('proposals')
  @UseGuards(JwtAuthGuard)
  createProposal(@Body() createDto: CreateProposalDto, @CurrentUser() user: User) {
    return this.recruitmentService.createProposal(createDto, user);
  }

  @Get('proposals')
  @UseGuards(JwtAuthGuard)
  getProposals(
    @CurrentUser() user: User,
    @Query('statusId') statusId?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.recruitmentService.getProposals(user, { statusId, storeId });
  }

  @Get('proposals/:id')
  @UseGuards(JwtAuthGuard)
  getProposal(@Param('id') id: string, @CurrentUser() user: User) {
    return this.recruitmentService.getProposal(id, user);
  }

  @Patch('proposals/:id')
  @UseGuards(JwtAuthGuard)
  updateProposal(
    @Param('id') id: string,
    @Body() updateDto: UpdateProposalDto,
    @CurrentUser() user: User,
  ) {
    return this.recruitmentService.updateProposal(id, updateDto, user);
  }

  // ============ Headcount ============
  @Post('headcounts')
  @UseGuards(JwtAuthGuard)
  createHeadcount(@Body() createDto: CreateHeadcountDto, @CurrentUser() user: User) {
    return this.recruitmentService.createHeadcount(createDto, user);
  }

  @Get('headcounts')
  @UseGuards(JwtAuthGuard)
  getHeadcounts(
    @CurrentUser() user: User,
    @Query('year') year?: string,
    @Query('departmentId') departmentId?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.recruitmentService.getHeadcounts(user, {
      year: year ? parseInt(year) : undefined,
      departmentId,
      storeId,
    });
  }

  @Patch('headcounts/:id')
  @UseGuards(JwtAuthGuard)
  updateHeadcount(
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateHeadcountDto>,
    @CurrentUser() user: User,
  ) {
    return this.recruitmentService.updateHeadcount(id, updateDto, user);
  }

  @Delete('headcounts/:id')
  @UseGuards(JwtAuthGuard)
  deleteHeadcount(@Param('id') id: string, @CurrentUser() user: User) {
    return this.recruitmentService.deleteHeadcount(id, user);
  }

  // ============ Public Application Form ============
  @Post('apply')
  apply(@Body() applyDto: ApplyCandidateDto) {
    return this.recruitmentService.applyCandidate(applyDto);
  }

  @Get('forms/link/:link')
  getFormByLink(@Param('link') link: string) {
    return this.recruitmentService.getFormByLink(link);
  }

  @Get('campaigns/link/:link')
  getCampaignByLink(@Param('link') link: string) {
    return this.recruitmentService.getCampaignByLink(link);
  }
}
