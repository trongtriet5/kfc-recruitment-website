import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { RecruitmentService } from './recruitment.service';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('recruitment')
export class RecruitmentController {
  constructor(private service: RecruitmentService) {}

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

  // Headcounts
  @Get('headcounts')
  getHeadcounts() { return this.service.getHeadcounts(); }
  
  @Post('headcounts')
  createHeadcount(@Body() data: any) { return this.service.createHeadcount(data); }

  // Dashboard
  @Get('dashboard')
  getDashboard() { return this.service.getDashboard(); }

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
}
