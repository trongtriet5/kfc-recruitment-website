import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CampaignFulfillmentService {
  constructor(private prisma: PrismaService) {}

  /**
   * Update campaign fulfillment counts based on candidate status changes
   */
  async updateCampaignFulfillment(campaignId: string): Promise<void> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId }
    });
    if (!campaign) return;
    const candidates = await this.prisma.candidate.findMany({
      where: { campaignId },
    });
    const statusIds = [...new Set(candidates.map(c => c.statusId).filter(Boolean))];
    const statuses = await this.prisma.candidateStatus.findMany({ where: { id: { in: statusIds } } });
    const statusMap = Object.fromEntries(statuses.map(s => [s.id, s.code]));
    // OFFER_ACCEPTED = Trúng tuyển (manager selected, candidate accepted offer)
    const offerAcceptedQty = candidates.filter(c =>
      ['OFFER_ACCEPTED', 'WAITING_ONBOARDING', 'ONBOARDING_ACCEPTED', 'ONBOARDING_REJECTED'].includes(statusMap[c.statusId] || '')
    ).length;

    // ONBOARDING_ACCEPTED = Đồng ý nhận việc (actually started working)
    const hiredQty = candidates.filter(c =>
      ['ONBOARDING_ACCEPTED'].includes(statusMap[c.statusId] || '')
    ).length;

    // fulfilledQty = Trúng tuyển (OFFER_ACCEPTED and related statuses)
    const fulfilledQty = offerAcceptedQty;

    // Auto-update campaign status if fulfilled
    let status = campaign.status;
    if (campaign.isUntilFilled && fulfilledQty >= campaign.targetQty && campaign.targetQty > 0) {
      status = 'COMPLETED';
    }

    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        offerAcceptedQty,
        hiredQty,
        fulfilledQty,
        status,
      },
    });
  }

  /**
   * Get fulfillment metrics for a campaign
   */
  async getFulfillmentMetrics(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId }
    });
    if (!campaign) return null;
    const candidates = await this.prisma.candidate.findMany({
      where: { campaignId },
    });
    const statusIds = [...new Set(candidates.map(c => c.statusId).filter(Boolean))];
    const statuses = await this.prisma.candidateStatus.findMany({ where: { id: { in: statusIds } } });
    const statusMap = Object.fromEntries(statuses.map(s => [s.id, s.code]));
    const totalCandidates = candidates.length;
    const screeningCount = candidates.filter(c =>
      ['CV_FILTERING'].includes(statusMap[c.statusId] || '')
    ).length;
    const passedScreening = candidates.filter(c =>
      ['CV_PASSED', 'WAITING_INTERVIEW', 'HR_INTERVIEW_PASSED', 'HR_INTERVIEW_FAILED',
       'SM_AM_INTERVIEW_PASSED', 'SM_AM_INTERVIEW_FAILED', 'SM_AM_NO_SHOW',
       'OM_PV_INTERVIEW_PASSED', 'OM_PV_INTERVIEW_FAILED', 'OM_PV_NO_SHOW'].includes(statusMap[c.statusId] || '')
    ).length;
    const interviewCount = candidates.filter(c =>
      ['WAITING_INTERVIEW', 'HR_INTERVIEW_PASSED', 'HR_INTERVIEW_FAILED',
       'SM_AM_INTERVIEW_PASSED', 'SM_AM_INTERVIEW_FAILED', 'SM_AM_NO_SHOW',
       'OM_PV_INTERVIEW_PASSED', 'OM_PV_INTERVIEW_FAILED', 'OM_PV_NO_SHOW'].includes(statusMap[c.statusId] || '')
    ).length;
    const offerCount = candidates.filter(c =>
      ['OFFER_SENT', 'OFFER_ACCEPTED', 'OFFER_REJECTED'].includes(statusMap[c.statusId] || '')
    ).length;
    const onboardingCount = candidates.filter(c =>
      ['WAITING_ONBOARDING', 'ONBOARDING_ACCEPTED', 'ONBOARDING_REJECTED'].includes(statusMap[c.statusId] || '')
    ).length;

    const conversionRates = {
      screeningToInterview: passedScreening > 0 ? Math.round((interviewCount / passedScreening) * 100) : 0,
      interviewToOffer: interviewCount > 0 ? Math.round((offerCount / interviewCount) * 100) : 0,
      offerToHire: offerCount > 0 ? Math.round((campaign.hiredQty / offerCount) * 100) : 0,
      overall: totalCandidates > 0 ? Math.round((campaign.hiredQty / totalCandidates) * 100) : 0,
    };

    return {
      campaignId: campaign.id,
      campaignName: campaign.name,
      targetQty: campaign.targetQty,
      fulfilledQty: campaign.fulfilledQty,
      hiredQty: campaign.hiredQty,
      offerAcceptedQty: campaign.offerAcceptedQty,
      completionRate: campaign.targetQty > 0 ? Math.round((campaign.fulfilledQty / campaign.targetQty) * 100) : 0,
      totalCandidates,
      screeningCount,
      passedScreening,
      interviewCount,
      offerCount,
      onboardingCount,
      conversionRates,
      status: campaign.status,
      isUntilFilled: campaign.isUntilFilled,
    };
  }

  /**
   * Get store-level fulfillment summary
   */
  async getStoreFulfillmentSummary(storeId: string) {
    const campaigns = await this.prisma.campaign.findMany({
      where: { storeId },
    });
    // For candidates, you must explicitly fetch with findMany({ where: { campaignId: campaign.id } })

    // Fetch candidate counts for each campaign
    const campaignIds = campaigns.map(c => c.id);
    const candidates = await this.prisma.candidate.findMany({
      where: { campaignId: { in: campaignIds } },
      select: { id: true, campaignId: true },
    });
    const candidateCountMap = Object.fromEntries(
      campaignIds.map(id => [id, 0])
    );
    candidates.forEach(c => { candidateCountMap[c.campaignId] = (candidateCountMap[c.campaignId] || 0) + 1; });

    return campaigns.map(campaign => ({
      campaignId: campaign.id,
      campaignName: campaign.name,
      targetQty: campaign.targetQty,
      fulfilledQty: campaign.fulfilledQty,
      completionRate: campaign.targetQty > 0 ? Math.round((campaign.fulfilledQty / campaign.targetQty) * 100) : 0,
      status: campaign.status,
      totalCandidates: candidateCountMap[campaign.id],
    }));
  }

  /**
   * Get aging report for candidates in a campaign
   */
  async getCampaignAgingReport(campaignId: string) {
    const candidates = await this.prisma.candidate.findMany({
      where: { campaignId },
    });
    // Fetch latest unexited SLA log for each candidate
    const candidateIds = candidates.map(c => c.id);
    const slaLogsAll = await this.prisma.candidateSLALog.findMany({
      where: { candidateId: { in: candidateIds }, exitedAt: null },
      orderBy: { enteredAt: 'desc' },
    });
    const slaLogMap = {};
    for (const log of slaLogsAll) {
      if (!slaLogMap[log.candidateId]) slaLogMap[log.candidateId] = log;
    }
    const now = new Date();
    return candidates.map(candidate => {
      const currentSlaLog = slaLogMap[candidate.id];
      const hoursInStage = currentSlaLog
        ? Math.round((now.getTime() - currentSlaLog.enteredAt.getTime()) / 3600000)
        : 0;
      const slaHours = currentSlaLog?.slaHours || 0;
      const hoursRemaining = slaHours > 0 ? Math.max(0, slaHours - hoursInStage) : null;
      const isBreached = candidate.slaBreachFlag;
      return {
        candidateId: candidate.id,
        candidateName: candidate.full_name,
        statusCode: candidate.statusId || null,
        statusName: null, // populate if needed
        hoursInStage,
        slaHours,
        hoursRemaining,
        isBreached,
        priority: candidate.priority,
      };
    });
  }
}

