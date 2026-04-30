import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AuditLogEntry {
  candidateId: string;
  actorId?: string;
  action: string;
  fromValue?: string | null;
  toValue?: string | null;
  metadata?: Record<string, any>;
  notes?: string;
  campaignId?: string;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: AuditLogEntry): Promise<void> {
    await this.prisma.candidateAuditLog.create({
      data: {
        candidateId: entry.candidateId,
        actorId: entry.actorId,
        action: entry.action,
        fromValue: entry.fromValue,
        toValue: entry.toValue,
        metadata: entry.metadata ?? {},
        notes: entry.notes,
        campaignId: entry.campaignId,
      },
    });
  }

async getAuditLogs(candidateId: string, options?: { limit?: number; offset?: number }): Promise<any[]> {
  // Fetch all logs first
  const logs = await this.prisma.candidateAuditLog.findMany({
    where: { candidateId },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });

  // Hydrate actor and campaign
  const uniqueActorIds = [...new Set(logs.map(l => l.actorId).filter(Boolean))];
  const uniqueCampaignIds = [...new Set(logs.map(l => l.campaignId).filter(Boolean))];
  const [users, campaigns] = await Promise.all([
    this.prisma.user.findMany({ where: { id: { in: uniqueActorIds } }, select: { id: true, full_name: true, email: true, role: true } }),
    this.prisma.campaign.findMany({ where: { id: { in: uniqueCampaignIds } }, select: { id: true, name: true } })
  ]);
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const campaignMap = Object.fromEntries(campaigns.map(c => [c.id, c]));

  return logs.map(log => ({
    ...log,
    actor: log.actorId ? userMap[log.actorId] : null,
    campaign: log.campaignId ? campaignMap[log.campaignId] : null
  }));
}

async getAuditLogsByCampaign(campaignId: string, options?: { limit?: number; offset?: number }): Promise<any[]> {
  // Fetch logs
  const logs = await this.prisma.candidateAuditLog.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 50,
    skip: options?.offset ?? 0,
  });
  // Hydrate actor and candidate
  const uniqueActorIds = [...new Set(logs.map(l => l.actorId).filter(Boolean))];
  const uniqueCandidateIds = [...new Set(logs.map(l => l.candidateId))];
  const [users, candidates] = await Promise.all([
    this.prisma.user.findMany({ where: { id: { in: uniqueActorIds } }, select: { id: true, full_name: true, email: true, role: true } }),
    this.prisma.candidate.findMany({ where: { id: { in: uniqueCandidateIds } }, select: { id: true, full_name: true, statusId: true } })
  ]);
  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const candidateMap = Object.fromEntries(candidates.map(c => [c.id, c]));

  return logs.map(log => ({
    ...log,
    actor: log.actorId ? userMap[log.actorId] : null,
    candidate: log.candidateId ? candidateMap[log.candidateId] : null
  }));
}



}

