import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { StatusTransitionService } from './status-transition.service';
import { AuditService } from './audit.service';
import { ProposalService } from './proposal.service';
import { CampaignFulfillmentService } from './campaign-fulfillment.service';
import { CurrentUser } from '../auth/decorators/user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('recruitment')
@UseGuards(JwtAuthGuard)
export class RecruitmentController {
  constructor(
    private service: RecruitmentService,
    private statusTransition: StatusTransitionService,
    private audit: AuditService,
    private proposalService: ProposalService,
    private campaignFulfillment: CampaignFulfillmentService,
  ) {}

  // Forms
  @Get('forms')
  getForms() { return this.service.getForms(); }
  
  @Get('forms/link/:link')
  getFormByLink(@Param('link') link: string) { return this.service.getFormByLink(decodeURIComponent(link)); }
  
  @Get('forms/:id')
  getForm(@Param('id') id: string) { return this.service.getForm(id); }
  
  @Post('forms')
  createForm(@Body() data: any) { return this.service.createForm(data); }
  
  @Patch('forms/:id')
  updateForm(@Param('id') id: string, @Body() data: any) { return this.service.updateForm(id, data); }
  
  @Delete('forms/:id')
  deleteForm(@Param('id') id: string) { return this.service.deleteForm(id); }

  // Campaigns
  @Get('campaigns')
  getCampaigns(@CurrentUser() user: any) { return this.service.getCampaigns(user); }
  @Get('campaigns/link/:link')
  getCampaignByLink(@Param('link') link: string) {
    return this.service.getCampaignByLink(decodeURIComponent(link));
  }
  
  @Get('campaigns/statistics')
  getCampaignStatistics(@Query('campaignId') campaignId?: string) {
    return this.service.getCampaignStatistics(campaignId);
  }
  
  @Get('campaigns/:id')
  getCampaign(@Param('id') id: string, @CurrentUser() user: any) { return this.service.getCampaign(id, user); }
  
  @Post('campaigns')
  createCampaign(@Body() data: any, @CurrentUser() user: any) { return this.service.createCampaign(data, user); }
  
  @Patch('campaigns/:id')
  updateCampaign(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) { 
    return this.service.updateCampaign(id, data, user); 
  }
  
  @Delete('campaigns/:id')
  deleteCampaign(@Param('id') id: string) { return this.service.deleteCampaign(id); }

  // Candidates
  @Get('candidates')
  getCandidates(@Query() query: any, @CurrentUser() user: any) { 
    return this.service.getCandidates(query, user); 
  }
  
  @Get('candidates/:id')
  getCandidate(@Param('id') id: string, @CurrentUser() user: any) { return this.service.getCandidate(id, user); }
  
  @Post('candidates')
  createCandidate(@Body() data: any, @CurrentUser() user: any) { return this.service.createCandidate(data, user); }
  
  @Patch('candidates/:id')
  updateCandidate(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) { 
    return this.service.updateCandidate(id, data, user); 
  }
  
  @Delete('candidates/:id')
  deleteCandidate(@Param('id') id: string, @CurrentUser() user: any) { return this.service.deleteCandidate(id, user); }

  @Patch('candidates/:id/transfer-campaign')
  transferCampaign(@Param('id') id: string, @Body() data: { campaignId: string }, @CurrentUser() user: any) {
    return this.service.transferCampaign(id, data.campaignId, user);
  }

  @Get('users/tas')
  getTAs() {
    return this.service.getTAs();
  }

  @Patch('candidates/:id/assign-pic')
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
    const currentStatus = candidate.statusId ? 'CV_FILTERING' : null;
    return {
      currentStatus,
      allowedTransitions: this.statusTransition.getAllowedTransitions(currentStatus || null, user.role),
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
  getInterviews() { return this.service.getInterviews(); }
  
  @Post('interviews')
  createInterview(@Body() data: any) { return this.service.createInterview(data); }
  
  @Patch('interviews/:id')
  updateInterview(@Param('id') id: string, @Body() data: any) { return this.service.updateInterview(id, data); }

  // Proposals
  @Get('proposals')
  getProposals(@CurrentUser() user: any) { return this.service.getProposals(user); }
  
  @Get('proposals/:id')
  getProposal(@Param('id') id: string, @CurrentUser() user: any) { return this.service.getProposal(id, user); }
  
  @Post('proposals')
  createProposal(@Body() data: any, @CurrentUser() user: any) { return this.service.createProposal(data, user); }
  
  @Patch('proposals/:id')
  updateProposal(@Param('id') id: string, @Body() data: any, @CurrentUser() user: any) { 
    return this.service.updateProposal(id, data, user); 
  }

  @Delete('proposals/:id')
  deleteProposal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.deleteProposal(id, user);
  }

  // Proposal Workflow (Enhanced Approval Flow)
  @Post('proposals/:id/submit')
  submitProposal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.proposalService.submitProposal(id, user.id, user.role);
  }

  @Post('proposals/:id/review')
  reviewProposal(@Param('id') id: string, @Body() data: { notes?: string }, @CurrentUser() user: any) {
    return this.proposalService.reviewProposal(id, user.id, user.role, data.notes);
  }

  @Post('proposals/:id/hr-accept')
  hrAcceptProposal(@Param('id') id: string, @Body() data: { notes?: string }, @CurrentUser() user: any) {
    return this.proposalService.hrAcceptProposal(id, user.id, user.role, data.notes);
  }

  @Post('proposals/:id/approve')
  approveProposal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.proposalService.approveProposal(id, user.id, user.role);
  }

  @Post('proposals/:id/reject')
  rejectProposal(@Param('id') id: string, @Body() data: { reason: string }, @CurrentUser() user: any) {
    return this.proposalService.rejectProposal(id, user.id, user.role, data.reason);
  }

  @Post('proposals/:id/cancel')
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
  getHeadcounts() { return this.service.getHeadcounts(); }
  
  @Post('headcounts')
  createHeadcount(@Body() data: any) { return this.service.createHeadcount(data); }

  // Dashboard
  @Get('dashboard')
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
  getSources() { return this.service.getSources(); }

  @Get('sources/:id')
  getSource(@Param('id') id: string) { return this.service.getSource(id); }

  @Post('sources')
  createSource(@Body() data: any) { return this.service.createSource(data); }

  @Patch('sources/:id')
  updateSource(@Param('id') id: string, @Body() data: any) { return this.service.updateSource(id, data); }

  @Delete('sources/:id')
  deleteSource(@Param('id') id: string) { return this.service.deleteSource(id); }

  @Get('sources/code/:code')
  getSourceByCode(@Param('code') code: string) { return this.service.getSourceByCode(code); }

  @Post('apply')
  apply(@Body() data: any) { return this.service.apply(data); }

  @Get('public/stores')
  getPublicStores() { return this.service.getPublicStores(); }

  @Get('public/positions')
  getPublicPositions() { return this.service.getPublicPositions(); }

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
