import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Res, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { RecruitmentService } from './recruitment.service';
import { CandidateWriteService } from './candidate-write.service';
import { StatusTransitionService } from './status-transition.service';
import { AuditService } from './audit.service';
import { ProposalService } from './proposal.service';
import { CampaignFulfillmentService } from './campaign-fulfillment.service';
import { CandidateReadService } from './candidate-read.service';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('recruitment')
@UseGuards(JwtAuthGuard)
export class RecruitmentController {
  constructor(
    private service: RecruitmentService,
    private statusTransition: StatusTransitionService,
    private audit: AuditService,
    private proposalService: ProposalService,
    private campaignFulfillment: CampaignFulfillmentService,
    private candidateReadService: CandidateReadService,
    private candidateWriteService: CandidateWriteService,
  ) {}

  // Forms
  @Get('forms')
  @Permissions('FORM_READ')
  @UseGuards(PermissionsGuard)
  getForms() { return this.service.getForms(); }
  
  
  @Get('forms/:id')
  @Permissions('FORM_READ')
  @UseGuards(PermissionsGuard)
  getForm(@Param('id') id: string) { return this.service.getForm(id); }
  
  @Post('forms')
  @Permissions('FORM_CREATE', 'FORM_DUPLICATE')
  @UseGuards(PermissionsGuard)
  createForm(@Body() data: any) { return this.service.createForm(data); }
  
  @Patch('forms/:id')
  @Permissions('FORM_UPDATE', 'FORM_DESIGN')
  @UseGuards(PermissionsGuard)
  updateForm(@Param('id') id: string, @Body() data: any) { return this.service.updateForm(id, data); }
  
  @Delete('forms/:id')
  @Permissions('FORM_DELETE')
  @UseGuards(PermissionsGuard)
  deleteForm(@Param('id') id: string) { return this.service.deleteForm(id); }

  // Campaigns
  @Get('campaigns')
  @Permissions('CAMPAIGN_READ')
  @UseGuards(PermissionsGuard)
  getCampaigns(@CurrentUser() user: any) { return this.service.getCampaigns(user); }
  
  @Get('campaigns/statistics')
  getCampaignStatistics(@Query('campaignId') campaignId?: string) {
    return this.service.getCampaignStatistics(campaignId);
  }
  
  @Get('campaigns/:id')
  @Permissions('CAMPAIGN_READ')
  @UseGuards(PermissionsGuard)
  getCampaign(@Param('id') id: string, @CurrentUser() user: any) { return this.service.getCampaign(id, user); }
  
  @Post('campaigns')
  @Permissions('CAMPAIGN_CREATE')
  @UseGuards(PermissionsGuard)
  createCampaign(@Body() data: any, @CurrentUser() user: any) { return this.service.createCampaign(data, user); }
  
  @Patch('campaigns/:id')
  @Permissions('CAMPAIGN_UPDATE')
  @UseGuards(PermissionsGuard)
  updateCampaign(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) { 
    return this.service.updateCampaign(id, data, user); 
  }
  
  @Delete('campaigns/:id')
  @Permissions('CAMPAIGN_DELETE')
  @UseGuards(PermissionsGuard)
  deleteCampaign(@Param('id') id: string) { return this.service.deleteCampaign(id); }

  // Candidates
  @Get('candidates/export')
  @Permissions('REPORT_EXPORT')
  @UseGuards(PermissionsGuard)
  async exportCandidates(@Res() res: Response, @Query() query: any, @CurrentUser() user: any) {
    const workbook = await this.candidateReadService.exportCandidates(query, user);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=candidates.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  }

  @Post('candidates/import-file')
  @UseInterceptors(FileInterceptor('file'))
  @Permissions('CANDIDATE_CREATE')
  @UseGuards(PermissionsGuard)
  importCandidates(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    return this.candidateWriteService.importCandidatesFromFile(file, user);
  }

  @Get('candidates')
  @Permissions('CANDIDATE_READ')
  @UseGuards(PermissionsGuard)
  getCandidates(@Query() query: any, @CurrentUser() user: any) { 
    return this.service.getCandidates(query, user); 
  }
  
  @Get('candidates/:id')
  @Permissions('CANDIDATE_READ')
  @UseGuards(PermissionsGuard)
  async getCandidate(@Param('id') id: string, @CurrentUser() user: any) { 
    const candidateReadService = this.candidateReadService;
    return candidateReadService.getCandidate(id, user); 
  }
  
  @Post('candidates')
  @Permissions('CANDIDATE_CREATE')
  @UseGuards(PermissionsGuard)
  createCandidate(@Body() data: any, @CurrentUser() user: any) {
    return this.candidateWriteService.createCandidate(data, user);
  }
  
  @Patch('candidates/:id')
  @Permissions('CANDIDATE_UPDATE')
  @UseGuards(PermissionsGuard)
  updateCandidate(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) {
    return this.service.updateCandidate(id, data, user);
  }

  @Patch('candidates/:id/transfer-campaign')
  @Permissions('CANDIDATE_TRANSFER_CAMPAIGN')
  @UseGuards(PermissionsGuard)
  transferCampaign(
    @Param('id') id: string,
    @Body() data: { campaignId: string },
    @CurrentUser() user: any,
  ) {
    return this.service.transferCampaign(id, data.campaignId, user);
  }
  
  @Delete('candidates/:id')
  @Permissions('CANDIDATE_DELETE')
  @UseGuards(PermissionsGuard)
  deleteCandidate(@Param('id') id: string, @CurrentUser() user: any) { return this.service.deleteCandidate(id, user); }

  @Get('users/tas')
  getTAs() {
    return this.service.getTAs();
  }

  @Get('users/select')
  @Permissions('CANDIDATE_READ')
  @UseGuards(PermissionsGuard)
  getUsersForSelect(@Query('role') role?: string) {
    return this.service.getUsersForSelect(role);
  }

  @Patch('candidates/:id/assign-pic')
  @Permissions('CANDIDATE_ASSIGN_PIC')
  @UseGuards(PermissionsGuard)
  assignPIC(@Param('id') id: string, @Body() data: { picId: string }) {
    return this.service.assignPIC(id, data.picId);
  }

  // Status Transition (Workflow Engine)
  @Post('candidates/:id/transition')
  async transitionStatus(
    @Param('id') id: string,
    @Body() data: { toStatus: string; reason?: string },
    @CurrentUser() user: any,
  ) {
    const candidate = await this.service.getCandidate(id, user);
    const currentStatus = candidate.statusId ? 'CV_FILTERING' : null;
    return this.statusTransition.transition(
      id,
      currentStatus || null,
      data.toStatus,
      user.id,
      user.role,
      data.reason,
    );
  }

  @Get('candidates/:id/allowed-transitions')
  async getAllowedTransitions(@Param('id') id: string, @CurrentUser() user: any) {
    const candidate = await this.service.getCandidate(id, user);
    const currentStatus = candidate.status?.code || null;
    return {
      currentStatus,
      allowedTransitions: this.statusTransition.getAllowedTransitions(currentStatus, user.role),
    };
  }

  // Audit Logs
  @Get('candidates/:id/audit-logs')
  getCandidateAuditLogs(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.audit.getAuditLogs(id, { limit: limit ? parseInt(limit) : 50 });
  }

  @Get('campaigns/:id/audit-logs')
  getCampaignAuditLogs(@Param('id') id: string, @Query('limit') limit?: string) {
    return this.audit.getAuditLogsByCampaign(id, { limit: limit ? parseInt(limit) : 50 });
  }

  // Interviews
  @Get('interviews')
  @Permissions('INTERVIEW_READ')
  @UseGuards(PermissionsGuard)
  getInterviews(@CurrentUser() user: any) { return this.candidateReadService.getInterviews(user); }
  
  @Post('interviews')
  @Permissions('INTERVIEW_CREATE')
  @UseGuards(PermissionsGuard)
  createInterview(@Body() data: any) { return this.service.createInterview(data); }
  
  @Patch('interviews/:id')
  @Permissions('INTERVIEW_UPDATE')
  @UseGuards(PermissionsGuard)
  updateInterview(@Param('id') id: string, @Body() data: any) { return this.service.updateInterview(id, data); }

  // Proposals
  @Get('proposals')
  @Permissions('PROPOSAL_READ')
  @UseGuards(PermissionsGuard)
  getProposals(@CurrentUser() user: any) { return this.service.getProposals(user); }
  
  @Get('proposals/:id')
  @Permissions('PROPOSAL_READ')
  @UseGuards(PermissionsGuard)
  getProposal(@Param('id') id: string, @CurrentUser() user: any) { return this.proposalService.getProposal(id, user.id, user.role); }
  
  @Post('proposals')
  @Permissions('PROPOSAL_CREATE')
  @UseGuards(PermissionsGuard)
  createProposal(@Body() data: any, @CurrentUser() user: any) { return this.proposalService.createProposal(data, user.id, user.role); }
  
  @Patch('proposals/:id')
  @Permissions('PROPOSAL_UPDATE')
  @UseGuards(PermissionsGuard)
  updateProposal(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) { 
    return this.service.updateProposal(id, data, user); 
  }

  @Delete('proposals/:id')
  @Permissions('PROPOSAL_DELETE')
  @UseGuards(PermissionsGuard)
  deleteProposal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.deleteProposal(id, user);
  }

  // Proposal Workflow (Enhanced Approval Flow)
  @Post('proposals/:id/submit')
  @Permissions('PROPOSAL_SUBMIT')
  @UseGuards(PermissionsGuard)
  submitProposal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.proposalService.submitProposal(id, user.id, user.role);
  }

  @Post('proposals/:id/review')
  @Permissions('PROPOSAL_REVIEW')
  @UseGuards(PermissionsGuard)
  reviewProposal(@Param('id') id: string, @Body() data: { notes?: string }, @CurrentUser() user: any) {
    return this.proposalService.reviewProposal(id, user.id, user.role, data.notes);
  }

  @Post('proposals/:id/hr-accept')
  @Permissions('PROPOSAL_REVIEW')
  @UseGuards(PermissionsGuard)
  hrAcceptProposal(@Param('id') id: string, @Body() data: { notes?: string }, @CurrentUser() user: any) {
    return this.proposalService.hrAcceptProposal(id, user.id, user.role, data.notes);
  }

  @Post('proposals/:id/approve')
  @Permissions('PROPOSAL_APPROVE')
  @UseGuards(PermissionsGuard)
  approveProposal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.proposalService.approveProposal(id, user.id, user.role);
  }

  @Post('proposals/:id/unapprove')
  @Permissions('PROPOSAL_APPROVE')
  @UseGuards(PermissionsGuard)
  unapproveProposal(@Param('id') id: string, @Body() data: { notes?: string }, @CurrentUser() user: any) {
    return this.proposalService.unapproveProposal(id, user.id, user.role, data.notes);
  }

  @Post('proposals/batch-approve')
  @Permissions('PROPOSAL_APPROVE')
  @UseGuards(PermissionsGuard)
  batchApproveProposals(@Body() data: { ids: string[] }, @CurrentUser() user: any) {
    return this.proposalService.batchApproveProposals(data.ids, user.id, user.role);
  }

  @Post('proposals/batch-reject')
  @Permissions('PROPOSAL_REJECT')
  @UseGuards(PermissionsGuard)
  batchRejectProposals(@Body() data: { ids: string[]; reason: string }, @CurrentUser() user: any) {
    return this.proposalService.batchRejectProposals(data.ids, user.id, user.role, data.reason);
  }

  @Post('proposals/:id/reject')
  @Permissions('PROPOSAL_REJECT')
  @UseGuards(PermissionsGuard)
  rejectProposal(@Param('id') id: string, @Body() data: { reason: string }, @CurrentUser() user: any) {
    return this.proposalService.rejectProposal(id, user.id, user.role, data.reason);
  }

  @Post('proposals/:id/cancel')
  @Permissions('PROPOSAL_CANCEL')
  @UseGuards(PermissionsGuard)
  cancelProposal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.proposalService.cancelProposal(id, user.id, user.role);
  }

  // Campaign Fulfillment
  @Get('campaigns/:id/fulfillment')
  getCampaignFulfillment(@Param('id') id: string) {
    return this.campaignFulfillment.getFulfillmentMetrics(id);
  }

  @Get('campaigns/:id/aging')
  getCampaignAging(@Param('id') id: string) {
    return this.campaignFulfillment.getCampaignAgingReport(id);
  }

  @Post('campaigns/:id/refresh-fulfillment')
  refreshCampaignFulfillment(@Param('id') id: string) {
    return this.campaignFulfillment.updateCampaignFulfillment(id);
  }

  // Headcounts
  @Get('headcounts')
  @Permissions('REPORT_VIEW')
  @UseGuards(PermissionsGuard)
  getHeadcounts() { return this.service.getHeadcounts(); }
  
  @Post('headcounts')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  createHeadcount(@Body() data: any) { return this.service.createHeadcount(data); }

  // Dashboard
  @Get('dashboard')
  @Permissions('REPORT_VIEW')
  @UseGuards(PermissionsGuard)
  getDashboard(
    @Query('campaignId') campaignId?: string,
    @Query('storeId') storeId?: string,
    @Query('taId') taId?: string,
    @Query('statusId') statusId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) { 
    return this.service.getDashboard({ 
      campaignId, 
      storeId, 
      taId, 
      statusId, 
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    }); 
  }

  // Sources
  @Get('sources')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  getSources() { return this.service.getSources(); }

  @Get('sources/:id')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  getSource(@Param('id') id: string) { return this.service.getSource(id); }

  @Post('sources')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  createSource(@Body() data: any) { return this.service.createSource(data); }

  @Patch('sources/:id')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  updateSource(@Param('id') id: string, @Body() data: any) { return this.service.updateSource(id, data); }

  @Delete('sources/:id')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  deleteSource(@Param('id') id: string) { return this.service.deleteSource(id); }

  @Get('sources/code/:code')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  getSourceByCode(@Param('code') code: string) { return this.service.getSourceByCode(code); }

  // Candidate Statuses
  @Get('statuses')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  getStatuses() { return this.service.getStatuses(); }

  @Get('statuses/:id')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  getStatus(@Param('id') id: string) { return this.service.getStatus(id); }

  @Post('statuses')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  createStatus(@Body() data: any) { return this.service.createStatus(data); }

  @Patch('statuses/:id')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  updateStatus(@Param('id') id: string, @Body() data: any) { return this.service.updateStatus(id, data); }

  @Delete('statuses/:id')
  @Permissions('SETTINGS_MANAGE')
  @UseGuards(PermissionsGuard)
  deleteStatus(@Param('id') id: string) { return this.service.deleteStatus(id); }


  @Get('positions')
  getPositions() { return this.service.getPublicPositions(); }

  // Notifications
  @Get('notifications')
  getNotifications(@CurrentUser() user: any, @Query('unreadOnly') unreadOnly?: string) {
    return this.service.getNotifications(user.id, unreadOnly === 'true');
  }

  @Patch('notifications/:id/read')
  markNotificationRead(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.markNotificationRead(id, user.id);
  }

  @Post('notifications/mark-all-read')
  markAllNotificationsRead(@CurrentUser() user: any) {
    return this.service.markAllNotificationsRead(user.id);
  }

  @Get('notifications/unread-count')
  getUnreadNotificationCount(@CurrentUser() user: any) {
    return this.service.getUnreadNotificationCount(user.id);
  }
}
