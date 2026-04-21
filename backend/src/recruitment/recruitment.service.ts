import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecruitmentService {
  constructor(private prisma: PrismaService) {}

  // Forms
  async getForms() {
    return this.prisma.recruitmentForm.findMany({
      include: { fields: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getForm(id: string) {
    const form = await this.prisma.recruitmentForm.findUnique({
      where: { id },
      include: { fields: true, campaigns: true, candidates: true },
    });
    if (!form) throw new NotFoundException('Form not found');
    return form;
  }

  async createForm(data: any) {
    return this.prisma.recruitmentForm.create({ data });
  }

  async updateForm(id: string, data: any) {
    return this.prisma.recruitmentForm.update({ where: { id }, data });
  }

  async deleteForm(id: string) {
    return this.prisma.recruitmentForm.delete({ where: { id } });
  }

  // Campaigns
  async getCampaigns() {
    return this.prisma.campaign.findMany({
      include: { form: true, candidates: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCampaign(id: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id },
      include: { form: true, candidates: true, store: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async createCampaign(data: any) {
    return this.prisma.campaign.create({ data });
  }

  async updateCampaign(id: string, data: any) {
    return this.prisma.campaign.update({ where: { id }, data });
  }

  async deleteCampaign(id: string) {
    return this.prisma.campaign.delete({ where: { id } });
  }

  // Candidates
  async getCandidates(filters?: any) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.campaignId) where.campaignId = filters.campaignId;
    if (filters?.storeId) where.storeId = filters.storeId;

    return this.prisma.candidate.findMany({
      where,
      include: { campaign: true, store: true, form: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCandidate(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: { campaign: true, store: true, interviews: true },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async createCandidate(data: any) {
    return this.prisma.candidate.create({ data });
  }

  async updateCandidate(id: string, data: any) {
    return this.prisma.candidate.update({ where: { id }, data });
  }

  async deleteCandidate(id: string) {
    return this.prisma.candidate.delete({ where: { id } });
  }

  // Interviews
  async getInterviews(filters?: any) {
    const where: any = {};
    if (filters?.candidateId) where.candidateId = filters.candidateId;
    if (filters?.interviewerId) where.interviewerId = filters.interviewerId;

    return this.prisma.interview.findMany({
      where,
      include: { candidate: true, interviewer: true },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async createInterview(data: any) {
    return this.prisma.interview.create({ data });
  }

  async updateInterview(id: string, data: any) {
    return this.prisma.interview.update({ where: { id }, data });
  }

  // Proposals
  async getProposals() {
    return this.prisma.recruitmentProposal.findMany({
      include: { store: true, position: true, candidates: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProposal(id: string) {
    const proposal = await this.prisma.recruitmentProposal.findUnique({
      where: { id },
      include: { store: true, position: true, candidates: true },
    });
    if (!proposal) throw new NotFoundException('Proposal not found');
    return proposal;
  }

  async createProposal(data: any) {
    return this.prisma.recruitmentProposal.create({ data });
  }

  async updateProposal(id: string, data: any) {
    return this.prisma.recruitmentProposal.update({ where: { id }, data });
  }

  // Headcounts
  async getHeadcounts() {
    return this.prisma.headcount.findMany({
      include: { store: true, positions: { include: { position: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createHeadcount(data: any) {
    return this.prisma.headcount.create({ data });
  }

  // Requests
  async getRequests() {
    return this.prisma.request.findMany({
      include: { store: true, position: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRequest(data: any) {
    return this.prisma.request.create({ data });
  }

  // Dashboard stats
  async getDashboard() {
    const totalCandidates = await this.prisma.candidate.count();
    const totalCampaigns = await this.prisma.campaign.count();
    const totalProposals = await this.prisma.recruitmentProposal.count();
    const activeCampaigns = await this.prisma.campaign.count({ where: { isActive: true } });

    return {
      totalCandidates,
      totalCampaigns,
      activeCampaigns,
      totalProposals,
    };
  }
}
