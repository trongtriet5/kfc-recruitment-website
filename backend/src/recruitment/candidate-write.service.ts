import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { CandidateGateway } from './candidate.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignFulfillmentService } from './campaign-fulfillment.service';
import readXlsxFile from 'read-excel-file/node';

const ALLOWED_SMAM_RESULTS = [
  'SM_AM_INTERVIEW_PASSED',
  'SM_AM_INTERVIEW_FAILED',
  'SM_AM_NO_SHOW',
  'OM_PV_INTERVIEW_PASSED',
  'OM_PV_INTERVIEW_FAILED',
  'OM_PV_NO_SHOW',
];

@Injectable()
export class CandidateWriteService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => CandidateGateway)) private readonly candidateGateway: CandidateGateway,
    private campaignFulfillmentService: CampaignFulfillmentService,
  ) { }

  async createCandidate(data: any, user?: any) {
    // Blacklist check
    if (data.phone || data.email) {
      const blacklistEntry = await this.checkBlacklist(data.phone, data.email);
      if (blacklistEntry) {
        throw new ForbiddenException(
          `Ứng viên nằm trong danh sách đen. Lý do: ${blacklistEntry.reason}`
        );
      }
    }

    const status = await this.prisma.candidateStatus.findUnique({
      where: { code: data.status || 'CV_FILTERING' }
    });

    let sourceId = data.sourceId;

    // Auto-assign source from Form if formId is present
    if (data.formId && !sourceId) {
      const form = await this.prisma.recruitmentForm.findUnique({
        where: { id: data.formId }
      });
      if (form?.sourceId) {
        sourceId = form.sourceId;
      }
    }

    if (data.sourceCode && !sourceId) {
      const source = await this.prisma.source.findUnique({
        where: { code: data.sourceCode }
      });
      if (source) sourceId = source.id;
    }

    // Calculate SLA due date
    const slaDueDate = status?.slaHours
      ? new Date(Date.now() + status.slaHours * 60 * 60 * 1000)
      : null;

    // Auto-assign storeId and proposalId from campaign if not present
    if (data.campaignId) {
      const campaign = await this.prisma.campaign.findUnique({
        where: { id: data.campaignId },
        select: { storeId: true, proposalId: true }
      });
      if (campaign) {
        if (!data.storeId && campaign.storeId) data.storeId = campaign.storeId;
        if (!data.proposalId && campaign.proposalId) data.proposalId = campaign.proposalId;
      }
    }

    const { status: statusName, sourceCode, fullName, ...rest } = data;

    // Ensure DateTime fields are valid JS Date objects
    if (rest.dateOfBirth) rest.dateOfBirth = new Date(rest.dateOfBirth);
    if (rest.availableStartDate) rest.availableStartDate = new Date(rest.availableStartDate);
    if (rest.slaDueDate) rest.slaDueDate = new Date(rest.slaDueDate);

    const candidate = await this.prisma.candidate.create({
      data: {
        ...rest,
        fullName: fullName,
        sourceId,
        statusId: status?.id,
        slaDueDate,
        priority: data.priority || 'NORMAL',
      }
    });


    // Create initial SLA log
    if (status) {
      await this.prisma.candidateSLALog.create({
        data: {
          candidateId: candidate.id,
          statusCode: status.code,
          enteredAt: new Date(),
          slaHours: status.slaHours || 0,
        }
      });
    }

    // Create initial audit log
    await this.prisma.candidateAuditLog.create({
      data: {
        candidateId: candidate.id,
        actorId: user?.id,
        action: 'CANDIDATE_CREATED',
        toValue: status?.name || 'CV_FILTERING',
        notes: data.sourceCode ? `Nguồn: ${data.sourceCode}` : null,
      }
    });

    // Emit socket event for real-time list updates
    this.candidateGateway.emitCandidateCreated(candidate);

    // Create notifications for Recruiters and Admins
    const staff = await this.prisma.user.findMany({
      where: {
        role: { in: ['RECRUITER', 'ADMIN'] },
        isActive: true
      },
      select: { id: true }
    });

    if (staff.length > 0) {
      const notificationData = staff.map(member => ({
        recipientId: member.id,
        type: 'NEW_CANDIDATE',
        title: 'Ứng viên mới',
        message: `Ứng viên ${candidate.fullName} vừa ứng tuyển vào hệ thống`,
        actionUrl: `/recruitment/candidates?id=${candidate.id}`,
        isRead: false
      }));

      // Create many doesn't return the objects with IDs in all Prisma versions easily, 
      // so we create one to emit and use createMany for the rest if possible, 
      // or just create them in a loop if the number of staff is small.
      // Given it's a few recruiters/admins, a loop or Promise.all is fine.

      const createdNotifications = await Promise.all(
        notificationData.map(n => this.prisma.notification.create({ data: n }))
      );

      // Emit all created notifications so each recipient gets their specific real-time update
      createdNotifications.forEach(notification => {
        this.candidateGateway.emitNotification(notification);
      });
    }

    return candidate;
  }

  async updateCandidate(id: string, data: any, user?: any) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: { status: true }
    });
    if (!candidate) throw new NotFoundException('Ứng viên không tồn tại');

    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      const campaignIdsFromUserProposals = await this.getCampaignIdsFromUserProposals(user.id);
      const isFromUserProposal = candidate.campaignId && campaignIdsFromUserProposals.includes(candidate.campaignId);

      const hasAccess = candidate.picId === user.id ||
        (candidate.storeId && storeIds.includes(candidate.storeId)) ||
        isFromUserProposal;

      if (!hasAccess) {
        throw new ForbiddenException('Bạn không có quyền cập nhật ứng viên này');
      }

      if (data.status && !ALLOWED_SMAM_RESULTS.includes(data.status)) {
        throw new ForbiddenException('Bạn không có quyền cập nhật trạng thái này');
      }
    }

    const { fullName, dateOfBirth, availableStartDate, status: statusName, ...rest } = data;
    const updateData: any = { ...rest };

    if (fullName) updateData.fullName = fullName;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (availableStartDate) updateData.availableStartDate = new Date(availableStartDate);

    if (statusName) {
      const status = await this.prisma.candidateStatus.findUnique({
        where: { code: statusName }
      });
      if (status) {
        updateData.statusId = status.id;
        if (status.slaHours) {
          updateData.slaDueDate = new Date(Date.now() + status.slaHours * 60 * 60 * 1000);
        }
      }
    }

    const updated = await this.prisma.candidate.update({
      where: { id },
      data: updateData,
    });

    // Log status change
    if (data.status && data.status !== candidate.status?.code) {
      await this.prisma.candidateAuditLog.create({
        data: {
          candidateId: id,
          actorId: user?.id,
          action: 'STATUS_CHANGED',
          fromValue: candidate.status?.code,
          toValue: data.status,
        }
      });

// Store previous status before update
      const previousStatusCode = candidate.status?.code;

      // Update fulfillment when status changes to a terminal positive status
      const terminalPositiveStatuses = ['ONBOARDING_ACCEPTED', 'OFFER_ACCEPTED'];
      if (terminalPositiveStatuses.includes(data.status)) {
        // Refresh updated candidate data
        const updatedCandidate = await this.prisma.candidate.findUnique({
          where: { id },
          select: { id: true, campaignId: true, proposalId: true, recruitmentProposalId: true, statusId: true }
        });

        console.log('[Fulfillment-updateCandidate] candidate:', {
          id: updatedCandidate?.id,
          campaignId: updatedCandidate?.campaignId,
          proposalId: updatedCandidate?.proposalId,
          recruitmentProposalId: updatedCandidate?.recruitmentProposalId,
          status: data.status,
        });

        // Update campaign fulfillment
        if (updatedCandidate?.campaignId) {
          await this.campaignFulfillmentService.updateCampaignFulfillment(updatedCandidate.campaignId);
        }

        // Update proposal fulfillment - check all possible proposal link paths
        let linkedProposalId = updatedCandidate?.recruitmentProposalId
          || updatedCandidate?.proposalId;
        if (!linkedProposalId && updatedCandidate?.campaignId) {
          const campaign = await this.prisma.campaign.findUnique({
            where: { id: updatedCandidate.campaignId },
            select: { proposalId: true }
          });
          linkedProposalId = campaign?.proposalId;
        }

        console.log('[Fulfillment-updateCandidate] linkedProposalId:', linkedProposalId);

        if (linkedProposalId) {
          const onboardingStatus = await this.prisma.candidateStatus.findUnique({
            where: { code: 'ONBOARDING_ACCEPTED' },
            select: { id: true }
          });

          let actualHiredQty = 0;
          if (onboardingStatus) {
            const directCount = await this.prisma.candidate.count({
              where: {
                OR: [
                  { proposalId: linkedProposalId },
                  { recruitmentProposalId: linkedProposalId },
                ],
                statusId: onboardingStatus.id,
              }
            });
            const linkedCampaigns = await this.prisma.campaign.findMany({
              where: { proposalId: linkedProposalId },
              select: { id: true }
            });
            const campaignCount = linkedCampaigns.length > 0
              ? await this.prisma.candidate.count({
                  where: {
                    campaignId: { in: linkedCampaigns.map(c => c.id) },
                    statusId: onboardingStatus.id,
                  }
                })
              : 0;
            actualHiredQty = directCount + campaignCount;
          }

          const proposal = await this.prisma.recruitmentProposal.findUnique({
            where: { id: linkedProposalId }
          });
          const completionRate = proposal?.quantity > 0
            ? Math.round((actualHiredQty / proposal.quantity) * 100)
            : 0;

          const existing = await this.prisma.proposalFulfillment.findUnique({
            where: { proposalId: linkedProposalId }
          });

          console.log('[Fulfillment-updateCandidate] counts & proposal:', {
            actualHiredQty,
            proposalQuantity: proposal?.quantity,
            completionRate,
            hasExistingFulfillment: !!existing,
          });

if (existing) {
            await this.prisma.proposalFulfillment.update({
              where: { proposalId: linkedProposalId },
              data: {
                hiredQty: actualHiredQty,
                onboardedQty: actualHiredQty,
                completionRate,
                lastUpdatedAt: new Date()
              }
            });
          } else {
            const newFulfillment = await this.prisma.proposalFulfillment.create({
              data: {
                proposalId: linkedProposalId,
                requestedQty: proposal?.quantity || 0,
                hiredQty: actualHiredQty,
                onboardedQty: actualHiredQty,
                completionRate,
                lastUpdatedAt: new Date()
              }
            });
            await this.prisma.recruitmentProposal.update({
              where: { id: linkedProposalId },
              data: { proposalFulfillmentId: newFulfillment.id }
            });
          }

          // Auto-complete proposal if hiredQty >= quantity
          if (actualHiredQty >= (proposal?.quantity || 0) && (proposal?.quantity || 0) > 0 && proposal?.status !== 'COMPLETED') {
            await this.prisma.recruitmentProposal.update({
              where: { id: linkedProposalId },
              data: { status: 'COMPLETED' }
            });
            console.log('[Fulfillment-updateCandidate] Proposal auto-completed:', linkedProposalId, 'hiredQty:', actualHiredQty);
          }
        }
      }

// Check if candidate is moving FROM terminal positive status TO a non-terminal status
      // This handles the revert case (e.g., moving from ONBOARDING_ACCEPTED back to waiting status)
      const fromIsTerminal = previousStatusCode && terminalPositiveStatuses.includes(previousStatusCode);
      const toIsTerminal = terminalPositiveStatuses.includes(data.status);
      
      if (fromIsTerminal && !toIsTerminal) {
        // Candidate is reverting from hired status - recalculate fulfillment and revert proposal/campaign
        await this.revertFulfillment(id);
      }
    }

    return updated;
  }

  async deleteCandidate(id: string, user?: any) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id } });
    if (!candidate) throw new NotFoundException('Ứng viên không tồn tại');

    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      const campaignIdsFromUserProposals = await this.getCampaignIdsFromUserProposals(user.id);
      const isFromUserProposal = candidate.campaignId && campaignIdsFromUserProposals.includes(candidate.campaignId);

      const hasAccess = candidate.picId === user.id ||
        (candidate.storeId && storeIds.includes(candidate.storeId)) ||
        isFromUserProposal;

      if (!hasAccess) {
        throw new ForbiddenException('Bạn không có quyền xóa ứng viên này');
      }
    }

    // Delete related records first to avoid foreign key constraint errors
    // Delete SLA logs
    await this.prisma.candidateSLALog.deleteMany({
      where: { candidateId: id }
    });

    // Delete audit logs
    await this.prisma.candidateAuditLog.deleteMany({
      where: { candidateId: id }
    });

    // Delete interviews (this will also delete interview feedback through cascade)
    await this.prisma.interview.deleteMany({
      where: { candidateId: id }
    });

    // Now delete the candidate
    return this.prisma.candidate.delete({ where: { id } });
  }

  async assignPIC(candidateId: string, picId: string) {
    const oldCandidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { picId: true }
    });

    await this.prisma.candidate.update({
      where: { id: candidateId },
      data: { picId }
    });

    const oldPic = oldCandidate?.picId
      ? await this.prisma.user.findUnique({ where: { id: oldCandidate.picId }, select: { fullName: true } })
      : null;
    const newPic = await this.prisma.user.findUnique({ where: { id: picId }, select: { fullName: true } });

    await this.prisma.candidateAuditLog.create({
      data: {
        candidateId,
        action: 'PIC_ASSIGNED',
        fromValue: oldPic?.fullName || 'Chưa phân công',
        toValue: newPic?.fullName || picId,
        notes: `Thay đổi người phụ trách từ ${oldPic?.fullName || 'Chưa phân công'} sang ${newPic?.fullName || picId}`,
      }
    });

    return { success: true };
  }

  async transferCampaign(candidateId: string, campaignId: string, user?: any) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });
    if (!candidate) throw new NotFoundException('Ứng viên không tồn tại');

    if (candidate.campaignId === campaignId) {
      throw new BadRequestException('Ứng viên đã nằm trong chiến dịch này rồi');
    }

    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Chiến dịch không tồn tại');

    if (campaign.status !== 'ACTIVE') {
      throw new BadRequestException('Chỉ có thể chuyển ứng viên vào chiến dịch đang hoạt động (ACTIVE)');
    }

    if (user && user.role !== 'ADMIN') {
      const storeIds = await this.getAccessibleStoreIds(user);
      if (!campaign.storeId || !storeIds.includes(campaign.storeId)) {
        throw new ForbiddenException('Bạn không có quyền chuyển ứng viên sang chiến dịch này');
      }
    }

    const updateData: any = { campaignId };
    if (campaign.storeId) {
      updateData.storeId = campaign.storeId;
    }
    if (campaign.proposalId) {
      updateData.proposalId = campaign.proposalId;
    }

    const updated = await this.prisma.candidate.update({
      where: { id: candidateId },
      data: updateData,
    });

    await this.prisma.candidateAuditLog.create({
      data: {
        candidateId,
        actorId: user?.id,
        action: 'CAMPAIGN_TRANSFERRED',
        notes: `Chuyển sang chiến dịch: ${campaign.name}`,
      }
    });

    return updated;
  }

  async importCandidatesFromFile(file: Express.Multer.File, user?: any) {
    try {
      const rows = await readXlsxFile(file.buffer);
      if (rows.length < 2) throw new Error('File không có dữ liệu');

      const header = rows[0] as any[];
      const dataRows = rows.slice(1);

      const findIdx = (keywords: string[]) => 
        header.findIndex(h => h && keywords.some(k => String(h).toLowerCase().includes(k.toLowerCase())));

      const nameIdx = findIdx(['họ tên', 'fullName', 'name']);
      const phoneIdx = findIdx(['điện thoại', 'phone', 'sđt']);
      const emailIdx = findIdx(['email']);
      const positionIdx = findIdx(['vị trí', 'position']);
      const storeIdx = findIdx(['cửa hàng', 'store', 'mã ch']);
      const campaignIdx = findIdx(['chiến dịch', 'campaign', 'mã cd']);
      const genderIdx = findIdx(['giới tính', 'gender']);
      const sourceIdx = findIdx(['nguồn', 'source']);

      const results = { success: 0, failed: 0, errors: [] as string[] };

      for (const row of dataRows) {
        try {
          const fullName = row[nameIdx] ? String(row[nameIdx]).trim() : null;
          const phone = row[phoneIdx] ? String(row[phoneIdx]).trim() : null;
          const email = row[emailIdx] ? String(row[emailIdx]).trim() : null;

          if (!fullName || !phone) {
            throw new Error('Thiếu họ tên hoặc số điện thoại');
          }

          // Find store if code provided
          let storeId = null;
          if (storeIdx !== -1 && row[storeIdx]) {
            const storeCode = String(row[storeIdx]).trim().split(' - ')[0];
            const store = await this.prisma.store.findFirst({
              where: { OR: [{ id: storeCode }, { code: storeCode }] }
            });
            if (store) storeId = store.id;
          }

          // Find campaign if code/name provided
          let campaignId = null;
          if (campaignIdx !== -1 && row[campaignIdx]) {
            const campaignVal = String(row[campaignIdx]).trim();
            const campaign = await this.prisma.campaign.findFirst({
              where: { OR: [{ id: campaignVal }, { name: campaignVal }] }
            });
            if (campaign) campaignId = campaign.id;
          }

          // Find source
          let sourceId = null;
          if (sourceIdx !== -1 && row[sourceIdx]) {
            const sourceVal = String(row[sourceIdx]).trim();
            const source = await this.prisma.source.findFirst({
              where: { OR: [{ id: sourceVal }, { name: sourceVal }, { code: sourceVal }] }
            });
            if (source) sourceId = source.id;
          }

          await this.createCandidate({
            fullName,
            phone,
            email,
            position: positionIdx !== -1 && row[positionIdx] ? String(row[positionIdx]).trim() : null,
            storeId,
            campaignId,
            sourceId,
            gender: genderIdx !== -1 && row[genderIdx] ? String(row[genderIdx]).trim() : null,
            status: 'CV_FILTERING'
          }, user);

          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push(`Lỗi dòng ${dataRows.indexOf(row) + 2}: ${error.message}`);
        }
      }

      return results;
    } catch (error: any) {
      throw new Error(`Lỗi xử lý file: ${error.message}`);
    }
  }

  private async checkBlacklist(phone?: string, email?: string) {
    if (!phone && !email) return null;

    const where: any[] = [];
    if (phone) where.push({ phone });
    if (email) where.push({ email });

    const blacklistEntry = await this.prisma.blacklist.findFirst({
      where: {
        OR: where,
        AND: [
          {
            OR: [
              { isPermanent: true },
              { expiryDate: { gt: new Date() } }
            ]
          }
        ]
      }
    });

    return blacklistEntry;
  }

  private async getAccessibleStoreIds(user: any): Promise<string[]> {
    if (!user || user.role === 'ADMIN') {
      const stores = await this.prisma.store.findMany({ select: { id: true } });
      return stores.map(s => s.id);
    }

    if (user.role === 'SM') {
      const u = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { managedStore: { select: { id: true } } }
      });
      return u?.managedStore ? [u.managedStore.id] : [];
    }

    if (user.role === 'AM') {
      const u = await this.prisma.user.findUnique({
        where: { id: user.id },
        include: { amStores: { select: { id: true } } }
      });
      return u?.amStores?.map(s => s.id) || [];
    }

    return [];
  }

  /**
   * Get campaign IDs from proposals created by the user
   * This allows proposal creators to update/delete candidates in campaigns from their proposals
   */
  private async getCampaignIdsFromUserProposals(userId: string): Promise<string[]> {
    const proposals = await this.prisma.recruitmentProposal.findMany({
      where: { requestedById: userId },
      select: { campaignId: true }
    });
    return proposals
      .map(p => p.campaignId)
      .filter((id): id is string => id !== null);
  }

  /**
   * Revert fulfillment when a hired candidate moves back to non-hired status
   * This handles the case when candidate reverts from ONBOARDING_ACCEPTED/OFFER_ACCEPTED to another status
   */
  private async revertFulfillment(candidateId: string): Promise<void> {
    console.log('[RevertFulfillment-write] Starting revert for candidate:', candidateId);

    // Get candidate with current data
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      select: { id: true, campaignId: true, proposalId: true, recruitmentProposalId: true }
    });

    if (!candidate) {
      console.log('[RevertFulfillment-write] Candidate not found');
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
          console.log('[RevertFulfillment-write] Campaign reverted to ACTIVE:', campaign.id, 'hiredQty:', updatedCampaign.hiredQty);
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
      console.log('[RevertFulfillment-write] No proposal found — skipping revert');
      return;
    }

    // Only revert if proposal is COMPLETED
    if (proposal.status !== 'COMPLETED') {
      console.log('[RevertFulfillment-write] Proposal not COMPLETED, skipping revert. Current status:', proposal.status);
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
      console.log('[RevertFulfillment-write] Proposal reverted to APPROVED:', proposal.id, 'actualHiredQty:', actualHiredQty);
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
}
