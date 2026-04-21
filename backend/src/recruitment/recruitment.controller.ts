import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';

@Controller('recruitment')
export class RecruitmentController {
  constructor(private service: RecruitmentService) {}

  // Forms
  @Get('forms')
  getForms() { return this.service.getForms(); }
  
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
  getCampaigns() { return this.service.getCampaigns(); }
  
  @Get('campaigns/:id')
  getCampaign(@Param('id') id: string) { return this.service.getCampaign(id); }
  
  @Post('campaigns')
  createCampaign(@Body() data: any) { return this.service.createCampaign(data); }
  
  @Patch('campaigns/:id')
  updateCampaign(@Param('id') id: string, @Body() data: any) { return this.service.updateCampaign(id, data); }
  
  @Delete('campaigns/:id')
  deleteCampaign(@Param('id') id: string) { return this.service.deleteCampaign(id); }

  // Candidates
  @Get('candidates')
  getCandidates() { return this.service.getCandidates(); }
  
  @Get('candidates/:id')
  getCandidate(@Param('id') id: string) { return this.service.getCandidate(id); }
  
  @Post('candidates')
  createCandidate(@Body() data: any) { return this.service.createCandidate(data); }
  
  @Patch('candidates/:id')
  updateCandidate(@Param('id') id: string, @Body() data: any) { return this.service.updateCandidate(id, data); }
  
  @Delete('candidates/:id')
  deleteCandidate(@Param('id') id: string) { return this.service.deleteCandidate(id); }

  // Interviews
  @Get('interviews')
  getInterviews() { return this.service.getInterviews(); }
  
  @Post('interviews')
  createInterview(@Body() data: any) { return this.service.createInterview(data); }
  
  @Patch('interviews/:id')
  updateInterview(@Param('id') id: string, @Body() data: any) { return this.service.updateInterview(id, data); }

  // Proposals
  @Get('proposals')
  getProposals() { return this.service.getProposals(); }
  
  @Get('proposals/:id')
  getProposal(@Param('id') id: string) { return this.service.getProposal(id); }
  
  @Post('proposals')
  createProposal(@Body() data: any) { return this.service.createProposal(data); }
  
  @Patch('proposals/:id')
  updateProposal(@Param('id') id: string, @Body() data: any) { return this.service.updateProposal(id, data); }

  // Headcounts
  @Get('headcounts')
  getHeadcounts() { return this.service.getHeadcounts(); }
  
  @Post('headcounts')
  createHeadcount(@Body() data: any) { return this.service.createHeadcount(data); }

  // Requests
  @Get('requests')
  getRequests() { return this.service.getRequests(); }
  
  @Post('requests')
  createRequest(@Body() data: any) { return this.service.createRequest(data); }

  // Dashboard
  @Get('dashboard')
  getDashboard() { return this.service.getDashboard(); }
}
