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
    return this.prisma.candidateAuditLog.findMany({
      where: { candidateId },
      include: {
        actor: { select: { id: true, fullName: true, email: true, role: true } },
        campaign: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }

  async getAuditLogsByCampaign(campaignId: string, options?: { limit?: number; offset?: number }): Promise<any[]> {
    return this.prisma.candidateAuditLog.findMany({
      where: { campaignId },
      include: {
        actor: { select: { id: true, fullName: true, email: true, role: true } },
        candidate: { select: { id: true, fullName: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    });
  }
}

