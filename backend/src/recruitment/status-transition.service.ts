import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

export interface StatusTransitionRule {
  from: string[];      // '*' means any
  to: string;
  allowedRoles: string[];
  requiresReason?: boolean;
  reasonCodes?: string[];
}

export const STATUS_TRANSITIONS: StatusTransitionRule[] = [
  // Application stage
  { from: ['*'], to: 'CV_FILTERING', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['CV_FILTERING'], to: 'CV_PASSED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['CV_FILTERING'], to: 'CV_FAILED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'], requiresReason: true },
  { from: ['CV_FILTERING'], to: 'BLACKLIST', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT'], requiresReason: true },
  { from: ['CV_FILTERING'], to: 'CANNOT_CONTACT', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['CV_FILTERING'], to: 'AREA_NOT_RECRUITING', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },

  // Interview stage
  { from: ['CV_PASSED'], to: 'WAITING_INTERVIEW', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['WAITING_INTERVIEW'], to: 'HR_INTERVIEW_PASSED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['WAITING_INTERVIEW'], to: 'HR_INTERVIEW_FAILED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'], requiresReason: true },
  { from: ['HR_INTERVIEW_PASSED'], to: 'SM_AM_INTERVIEW_PASSED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER', 'USER'] },
  { from: ['HR_INTERVIEW_PASSED'], to: 'SM_AM_INTERVIEW_FAILED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER', 'USER'], requiresReason: true },
  { from: ['HR_INTERVIEW_PASSED'], to: 'SM_AM_NO_SHOW', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER', 'USER'] },
  { from: ['SM_AM_INTERVIEW_PASSED'], to: 'OM_PV_INTERVIEW_PASSED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER'] },
  { from: ['SM_AM_INTERVIEW_PASSED'], to: 'OM_PV_INTERVIEW_FAILED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER'], requiresReason: true },
  { from: ['SM_AM_INTERVIEW_PASSED'], to: 'OM_PV_NO_SHOW', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'MANAGER'] },

  // Offer stage
  { from: ['OM_PV_INTERVIEW_PASSED'], to: 'OFFER_SENT', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['OFFER_SENT'], to: 'OFFER_ACCEPTED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['OFFER_SENT'], to: 'OFFER_REJECTED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'], requiresReason: true },

  // Onboarding stage
  { from: ['OFFER_ACCEPTED'], to: 'WAITING_ONBOARDING', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'] },
  { from: ['WAITING_ONBOARDING'], to: 'ONBOARDING_ACCEPTED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER', 'MANAGER', 'USER'] },
  { from: ['WAITING_ONBOARDING'], to: 'ONBOARDING_REJECTED', allowedRoles: ['ADMIN', 'HEAD_OF_DEPARTMENT', 'RECRUITER'], requiresReason: true },

  // Revert rules (ADMIN only for most)
  { from: ['*'], to: 'CV_FILTERING', allowedRoles: ['ADMIN'] },
];

export const STATUS_GROUPS: Record<string, string> = {
  CV_FILTERING: 'application',
  CV_PASSED: 'application',
  CV_FAILED: 'application',
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

export const TERMINAL_STATUSES = ['BLACKLIST', 'CV_FAILED', 'HR_INTERVIEW_FAILED', 'SM_AM_INTERVIEW_FAILED', 'OM_PV_INTERVIEW_FAILED', 'OFFER_REJECTED', 'ONBOARDING_REJECTED', 'ONBOARDING_ACCEPTED'];

@Injectable()
export class StatusTransitionService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /**
   * Validate and execute a status transition
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
      await this.updateFulfillment(candidate, toStatusCode);
    }

    return { success: true };
  }

  private findTransitionRule(
    fromStatus: string | null,
    toStatus: string,
    actorRole: string,
  ): StatusTransitionRule | undefined {
    return STATUS_TRANSITIONS.find((rule) => {
      const matchFrom = rule.from.includes('*') || rule.from.includes(fromStatus || '');
      const matchTo = rule.to === toStatus;
      const matchRole = rule.allowedRoles.includes(actorRole);
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
    // Update campaign fulfillment
    if (candidate.campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: candidate.campaignId },
      });
      if (campaign) {
        const updateData: any = {};
        // OFFER_ACCEPTED and related = Trúng tuyển
        if (statusCode === 'OFFER_ACCEPTED') {
          updateData.offerAcceptedQty = { increment: 1 };
          updateData.fulfilledQty = { increment: 1 }; // Trúng tuyển
        }
        // ONBOARDING_ACCEPTED = Đồng ý nhận việc
        if (statusCode === 'ONBOARDING_ACCEPTED') {
          updateData.hiredQty = { increment: 1 };
          // Don't increment fulfilledQty again since this is already counted in OFFER_ACCEPTED
        }
        await this.prisma.campaign.update({
          where: { id: campaign.id },
          data: updateData,
        });
      }
    }

    // Update proposal fulfillment
    const candidateProposals = await this.prisma.recruitmentProposal.findMany({
      where: { 
        OR: [
          { candidates: { some: { id: candidate.id } } },
          { id: candidate.proposalId }
        ]
      },
    });

    for (const proposal of candidateProposals) {
      const fulfillment = await this.prisma.proposalFulfillment.findUnique({
        where: { proposalId: proposal.id },
      });

      if (fulfillment) {
        const updateData: any = {};
        if (statusCode === 'OFFER_ACCEPTED') {
          updateData.offerAcceptedQty = { increment: 1 };
        }
        if (statusCode === 'ONBOARDING_ACCEPTED') {
          updateData.hiredQty = { increment: 1 };
          updateData.onboardedQty = { increment: 1 };
        }
        // Recalculate completion rate
        const completionRate = proposal.quantity > 0
          ? Math.round(((fulfillment.onboardedQty + (statusCode === 'ONBOARDING_ACCEPTED' ? 1 : 0)) / proposal.quantity) * 100)
          : 0;
        updateData.completionRate = completionRate;

        await this.prisma.proposalFulfillment.update({
          where: { id: fulfillment.id },
          data: updateData,
        });
      }
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
   */
  getAllowedTransitions(currentStatusCode: string | null, actorRole: string): string[] {
    const codes = new Set<string>();
    for (const rule of STATUS_TRANSITIONS) {
      const matchFrom = rule.from.includes('*') || rule.from.includes(currentStatusCode || '');
      const matchRole = rule.allowedRoles.includes(actorRole);
      if (matchFrom && matchRole) {
        codes.add(rule.to);
      }
    }
    return Array.from(codes);
  }
}

