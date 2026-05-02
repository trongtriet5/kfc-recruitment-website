import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import { CampaignFulfillmentService } from './campaign-fulfillment.service';
import {
  STATUS_TRANSITIONS,
  TERMINAL_STATUSES,
  canTransition,
  getAllowedTransitions,
  Role,
  TransitionRule,
} from './constraints';

export const STATUS_GROUPS: Record<string, string> = {
  CV_FILTERING: 'application',
  BLACKLIST: 'application',
  CANNOT_CONTACT: 'application',
  AREA_NOT_RECRUITING: 'application',

  WAITING_INTERVIEW: 'interview',
  HR_INTERVIEW_PASSED: 'interview',
  HR_INTERVIEW_FAILED: 'interview',
  SM_AM_INTERVIEW_PASSED: 'interview',
  SM_AM_INTERVIEW_FAILED: 'interview',
  SM_AM_NO_SHOW: 'interview',
  OM_PV_INTERVIEW_PASSED: 'interview',
  OM_PV_INTERVIEW_FAILED: 'interview',
  OM_PV_NO_SHOW: 'interview',

  OFFER_SENT: 'offer',
  OFFER_ACCEPTED: 'offer',
  OFFER_REJECTED: 'offer',

  WAITING_ONBOARDING: 'onboarding',
  ONBOARDING_ACCEPTED: 'onboarding',
  ONBOARDING_REJECTED: 'onboarding',
};

export { STATUS_TRANSITIONS, TERMINAL_STATUSES }; // Re-export from constraints

@Injectable()
export class StatusTransitionService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private campaignFulfillmentService: CampaignFulfillmentService,
  ) {}

  /**
   * Validate and execute a status transition
   * Uses centralized constraints from constraints.ts
   */
  async transition(
    candidateId: string,
    fromStatusCode: string | null,
    toStatusCode: string,
    actorId: string,
    actorRole: string,
    reason?: string,
  ): Promise<{ success: boolean; message?: string }> {
    // 1. Find candidate and current status
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { status: true },
    });

    if (!candidate) {
      throw new BadRequestException('Candidate not found');
    }

    const currentStatusCode = candidate.status?.code || null;

    // 2. Validate transition rule
    const rule = this.findTransitionRule(currentStatusCode, toStatusCode, actorRole);
    if (!rule) {
      throw new ForbiddenException(
        `Không được phép chuyển từ "${currentStatusCode || 'Mới'}" sang "${toStatusCode}" với vai trò ${actorRole}`,
      );
    }

    // 3. Check if reason is required
    if (rule.requiresReason && (!reason || reason.trim().length === 0)) {
      throw new BadRequestException(`Chuyển trạng thái này yêu cầu lý do`);
    }

    // 4. Check if candidate is blacklisted and trying to move forward
    if (candidate.isBlacklisted && !['BLACKLIST'].includes(toStatusCode)) {
      throw new ForbiddenException('Ứng viên đang nằm trong blacklist');
    }

    // 5. Prevent transition from terminal statuses without ADMIN
    if (currentStatusCode && TERMINAL_STATUSES.includes(currentStatusCode) && actorRole !== 'ADMIN') {
      throw new ForbiddenException('Không thể thay đổi trạng thái cuối');
    }

    // 6. Execute transition
    const targetStatus = await this.prisma.candidateStatus.findUnique({
      where: { code: toStatusCode },
    });

    if (!targetStatus) {
      throw new BadRequestException(`Trạng thái "${toStatusCode}" không tồn tại`);
    }

    // Update candidate status and SLA
    const now = new Date();
    const slaDueDate = targetStatus.slaHours
      ? new Date(now.getTime() + targetStatus.slaHours * 60 * 60 * 1000)
      : null;

    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: {
        statusId: targetStatus.id,
        slaDueDate,
        slaBreachFlag: false,
      },
    });

    // 7. Close previous SLA log and create new one
    if (currentStatusCode) {
      await this.closeSlaLog(candidateId, currentStatusCode);
    }
    await this.createSlaLog(candidateId, toStatusCode, targetStatus.slaHours || null);

    // 8. Audit log
    await this.audit.log({
      candidateId,
      actorId,
      action: 'STATUS_CHANGE',
      fromValue: currentStatusCode,
      toValue: toStatusCode,
      notes: reason,
      metadata: { role: actorRole, requiresReason: rule.requiresReason },
    });

// 9. Update campaign/proposal fulfillment if terminal positive status
    if (['ONBOARDING_ACCEPTED', 'OFFER_ACCEPTED'].includes(toStatusCode)) {
      // Re-fetch candidate to get latest proposalId/campaignId from DB
      const freshCandidate = await this.prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { id: true, campaignId: true, proposalId: true, recruitmentProposalId: true }
      });
      await this.updateFulfillment(freshCandidate || candidate, toStatusCode);
    }

    // 10. Check if candidate is moving FROM terminal positive status TO a non-terminal status
    // This handles the revert case (e.g., moving from ONBOARDING_ACCEPTED back to waiting status)
    const terminalPositiveStatuses = ['ONBOARDING_ACCEPTED', 'OFFER_ACCEPTED'];
    const fromIsTerminal = terminalPositiveStatuses.includes(currentStatusCode || '');
    const toIsTerminal = terminalPositiveStatuses.includes(toStatusCode);
    
if (fromIsTerminal && !toIsTerminal) {
      // Candidate is reverting from hired status - recalculate fulfillment and revert proposal/campaign
      await this.revertFulfillment(candidateId);
    }

    return { success: true };
  }

  private findTransitionRule(
    fromStatus: string | null,
    toStatus: string,
    actorRole: string,
  ): TransitionRule | undefined {
    return STATUS_TRANSITIONS.find((rule) => {
      const matchFrom = rule.from.includes('*') || rule.from.includes(fromStatus || '');
      const matchTo = rule.to === toStatus;
      const matchRole = rule.allowedRoles.includes(actorRole as Role);
      return matchFrom && matchTo && matchRole;
    });
  }

  private async closeSlaLog(candidateId: string, statusCode: string): Promise<void> {
    const openLog = await this.prisma.candidateSLALog.findFirst({
      where: { candidateId, statusCode, exitedAt: null },
      orderBy: { enteredAt: 'desc' },
    });

    if (openLog) {
      const now = new Date();
      const breachHours = openLog.slaHours
        ? Math.max(0, (now.getTime() - openLog.enteredAt.getTime()) / 3600000 - openLog.slaHours)
        : null;

      await this.prisma.candidateSLALog.update({
        where: { id: openLog.id },
        data: {
          exitedAt: now,
          breached: breachHours !== null && breachHours > 0,
          breachHours: breachHours ? Math.round(breachHours) : null,
        },
      });
    }
  }

  private async createSlaLog(candidateId: string, statusCode: string, slaHours: number | null): Promise<void> {
    await this.prisma.candidateSLALog.create({
      data: {
        candidateId,
        statusCode,
        enteredAt: new Date(),
        slaHours: slaHours || 0,
      },
    });
  }

  private async updateFulfillment(candidate: any, statusCode: string): Promise<void> {
    // ── 1. Update campaign fulfillment ──────────────────────────────────────
    if (candidate.campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: candidate.campaignId },
      });
      if (campaign) {
        const updateData: any = {};
        if (statusCode === 'OFFER_ACCEPTED') {
          updateData.offerAcceptedQty = { increment: 1 };
        }
        if (statusCode === 'ONBOARDING_ACCEPTED') {
          updateData.hiredQty = { increment: 1 };
          updateData.fulfilledQty = { increment: 1 };
          const newHiredQty = (campaign.hiredQty || 0) + 1;
          if (newHiredQty >= (campaign.targetQty || 0) && (campaign.targetQty || 0) > 0) {
            updateData.status = 'COMPLETED';
          }
        }
        if (Object.keys(updateData).length > 0) {
          await this.prisma.campaign.update({
            where: { id: campaign.id },
            data: updateData,
          });
        }
      }
    }

    // ── 2. Update proposal fulfillment ──────────────────────────────────────
    // Find linked proposal via proposalId, recruitmentProposalId, or campaign.proposalId
    const linkedProposalId = candidate.proposalId || candidate.recruitmentProposalId;
    let proposal: any = null;

    console.log('[Fulfillment] candidate fields:', {
      id: candidate.id,
      campaignId: candidate.campaignId,
      proposalId: candidate.proposalId,
      recruitmentProposalId: candidate.recruitmentProposalId,
      statusCode,
    });

    if (linkedProposalId) {
      proposal = await this.prisma.recruitmentProposal.findUnique({
        where: { id: linkedProposalId },
      });
      console.log('[Fulfillment] found proposal via linkedProposalId:', proposal?.id ?? 'NOT FOUND');
    }

    if (!proposal && candidate.campaignId) {
      const camp = await this.prisma.campaign.findUnique({
        where: { id: candidate.campaignId },
        select: { proposalId: true },
      });
      console.log('[Fulfillment] campaign.proposalId:', camp?.proposalId);
      if (camp?.proposalId) {
        proposal = await this.prisma.recruitmentProposal.findUnique({
          where: { id: camp.proposalId },
        });
        console.log('[Fulfillment] found proposal via campaign:', proposal?.id ?? 'NOT FOUND');
      }
    }

    if (!proposal) {
      console.log('[Fulfillment] No proposal found — skipping proposal update');
      return;
    }

    // Count actual ONBOARDING_ACCEPTED candidates for this proposal
    const onboardingStatus = await this.prisma.candidateStatus.findUnique({
      where: { code: 'ONBOARDING_ACCEPTED' },
      select: { id: true },
    });

    let actualHiredQty = 0;
    if (onboardingStatus) {
      const directCount = await this.prisma.candidate.count({
        where: {
          OR: [
            { proposalId: proposal.id },
            { recruitmentProposalId: proposal.id },
          ],
          statusId: onboardingStatus.id,
        },
      });
      const linkedCampaigns = await this.prisma.campaign.findMany({
        where: { proposalId: proposal.id },
        select: { id: true },
      });
      const campaignCount = linkedCampaigns.length > 0
        ? await this.prisma.candidate.count({
            where: {
              campaignId: { in: linkedCampaigns.map(c => c.id) },
              statusId: onboardingStatus.id,
            },
          })
        : 0;
      actualHiredQty = directCount + campaignCount;
    }

    const completionRate = proposal.quantity > 0
      ? Math.round((actualHiredQty / proposal.quantity) * 100)
      : 0;

    const fulfillmentData = {
      hiredQty: actualHiredQty,
      onboardedQty: actualHiredQty,
      completionRate,
      lastUpdatedAt: new Date(),
    };

    const existing = await this.prisma.proposalFulfillment.findUnique({
      where: { proposalId: proposal.id },
    });

    if (existing) {
      await this.prisma.proposalFulfillment.update({
        where: { proposalId: proposal.id },
        data: fulfillmentData,
      });
    } else {
      const newFulfillment = await this.prisma.proposalFulfillment.create({
        data: {
          proposalId: proposal.id,
          requestedQty: proposal.quantity,
          ...fulfillmentData,
        },
      });
      await this.prisma.recruitmentProposal.update({
        where: { id: proposal.id },
        data: { proposalFulfillmentId: newFulfillment.id },
      });
    }

// Auto-complete proposal if hiredQty >= quantity
    if (actualHiredQty >= proposal.quantity && proposal.quantity > 0 && proposal.status !== 'COMPLETED') {
      await this.prisma.recruitmentProposal.update({
        where: { id: proposal.id },
        data: { status: 'COMPLETED' },
      });
      await this.audit.log({
        candidateId: candidate.id,
        actorId: 'SYSTEM',
        action: 'STATUS_CHANGE',
        fromValue: proposal.status,
        toValue: 'COMPLETED',
        notes: 'Tự động hoàn thành do đủ số lượng trúng tuyển',
      });
    }
  }

  /**
   * Revert fulfillment when a hired candidate moves back to non-hired status
   * This handles the case when candidate reverts from ONBOARDING_ACCEPTED/OFFER_ACCEPTED to another status
   */
  private async revertFulfillment(candidateId: string): Promise<void> {
    console.log('[RevertFulfillment-transition] Starting revert for candidate:', candidateId);

    // Get candidate with current data
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true, campaignId: true, proposalId: true, recruitmentProposalId: true }
    });

    if (!candidate) {
      console.log('[RevertFulfillment-transition] Candidate not found');
      return;
    }

// ── 1. Revert campaign fulfillment ──────────────────────────────────────
    if (candidate.campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: candidate.campaignId },
      });
      if (campaign && campaign.status === 'COMPLETED') {
        // Use the service to recalculate campaign fulfillment counts
        await this.campaignFulfillmentService.updateCampaignFulfillment(candidate.campaignId);

        // Re-fetch campaign to check if status should revert
        const updatedCampaign = await this.prisma.campaign.findUnique({
          where: { id: candidate.campaignId },
        });

        // If below target, revert campaign status to ACTIVE
        if (updatedCampaign && (updatedCampaign.hiredQty || 0) < (updatedCampaign.targetQty || 0)) {
          await this.prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: 'ACTIVE' },
          });
          console.log('[RevertFulfillment-transition] Campaign reverted to ACTIVE:', campaign.id, 'hiredQty:', updatedCampaign.hiredQty);
        }
      }
    }

    // ── 2. Revert proposal fulfillment ──────────────────────────────────────
    const linkedProposalId = candidate.proposalId || candidate.recruitmentProposalId;
    let proposal: any = null;

    if (linkedProposalId) {
      proposal = await this.prisma.recruitmentProposal.findUnique({
        where: { id: linkedProposalId },
      });
    }

    if (!proposal && candidate.campaignId) {
      const camp = await this.prisma.campaign.findUnique({
        where: { id: candidate.campaignId },
        select: { proposalId: true },
      });
      if (camp?.proposalId) {
        proposal = await this.prisma.recruitmentProposal.findUnique({
          where: { id: camp.proposalId },
        });
      }
    }

    if (!proposal) {
      console.log('[RevertFulfillment-transition] No proposal found — skipping revert');
      return;
    }

    // Only revert if proposal is COMPLETED
    if (proposal.status !== 'COMPLETED') {
      console.log('[RevertFulfillment-transition] Proposal not COMPLETED, skipping revert. Current status:', proposal.status);
      return;
    }

    // Recalculate actual hired qty
    const onboardingStatus = await this.prisma.candidateStatus.findUnique({
      where: { code: 'ONBOARDING_ACCEPTED' },
      select: { id: true },
    });

    let actualHiredQty = 0;
    if (onboardingStatus) {
      const directCount = await this.prisma.candidate.count({
        where: {
          OR: [
            { proposalId: proposal.id },
            { recruitmentProposalId: proposal.id },
          ],
          statusId: onboardingStatus.id,
        },
      });
      const linkedCampaigns = await this.prisma.campaign.findMany({
        where: { proposalId: proposal.id },
        select: { id: true },
      });
      const campaignCount = linkedCampaigns.length > 0
        ? await this.prisma.candidate.count({
            where: {
              campaignId: { in: linkedCampaigns.map(c => c.id) },
              statusId: onboardingStatus.id,
            },
          })
        : 0;
      actualHiredQty = directCount + campaignCount;
    }

    // If below target, revert proposal status from COMPLETED to APPROVED
    if (actualHiredQty < proposal.quantity || proposal.quantity === 0) {
      await this.prisma.recruitmentProposal.update({
        where: { id: proposal.id },
        data: { status: 'APPROVED' },
      });
      console.log('[RevertFulfillment-transition] Proposal reverted to APPROVED:', proposal.id, 'actualHiredQty:', actualHiredQty);
    }

    // Update fulfillment data
    const completionRate = proposal.quantity > 0
      ? Math.round((actualHiredQty / proposal.quantity) * 100)
      : 0;

    const existing = await this.prisma.proposalFulfillment.findUnique({
      where: { proposalId: proposal.id },
    });

if (existing) {
      await this.prisma.proposalFulfillment.update({
        where: { proposalId: proposal.id },
        data: {
          hiredQty: actualHiredQty,
          onboardedQty: actualHiredQty,
          completionRate,
          lastUpdatedAt: new Date(),
        },
      });
    }
  }

  /**
   * Check SLA breaches and flag candidates
   */
  async checkSlaBreaches(): Promise<{ breached: number; checked: number }> {
    const now = new Date();
    const candidates = await this.prisma.candidate.findMany({
      where: {
        slaDueDate: { lt: now },
        slaBreachFlag: false,
        statusId: { not: null },
      },
      include: { status: true },
    });

    let breached = 0;
    for (const candidate of candidates) {
      await this.prisma.candidate.update({
        where: { id: candidate.id },
        data: { slaBreachFlag: true },
      });
      breached++;
    }

    return { breached, checked: candidates.length };
  }

  /**
   * Get allowed next statuses for a user role and current status
   * Uses centralized constraints from constraints.ts
   */
  getAllowedTransitions(currentStatusCode: string | null, actorRole: string): string[] {
    return getAllowedTransitions(currentStatusCode, actorRole as Role);
  }
}

