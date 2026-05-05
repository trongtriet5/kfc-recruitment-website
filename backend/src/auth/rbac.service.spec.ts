import { Test, TestingModule } from '@nestjs/testing';
import { RbacService } from './rbac.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RbacService', () => {
  let service: RbacService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RbacService>(RbacService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('hasPermission', () => {
    it('should allow ADMIN to CANDIDATE_CREATE', async () => {
      // Admin always has all permissions (mock returns null, so falls back to role check)
      expect(
        await service.hasPermission('1', 'ADMIN', 'CANDIDATE_CREATE' as any),
      ).toBe(true);
    });

    it('should allow ADMIN to all permissions', async () => {
      const permissions = [
        'CANDIDATE_CREATE',
        'CANDIDATE_READ',
        'CANDIDATE_UPDATE',
        'CAMPAIGN_CREATE',
        'PROPOSAL_APPROVE',
      ];
      for (const perm of permissions) {
        expect(await service.hasPermission('1', 'ADMIN', perm as any)).toBe(
          true,
        );
      }
    });

    it('should not allow SM to CANDIDATE_CREATE', async () => {
      // SM role doesn't have CANDIDATE_CREATE permission
      expect(
        await service.hasPermission('1', 'SM', 'CANDIDATE_CREATE' as any),
      ).toBe(false);
    });

    it('should allow SM to CANDIDATE_READ', async () => {
      // SM role has CANDIDATE_READ permission
      expect(
        await service.hasPermission('1', 'SM', 'CANDIDATE_READ' as any),
      ).toBe(true);
    });

    it('should allow AM to CANDIDATE_READ', async () => {
      expect(
        await service.hasPermission('1', 'AM', 'CANDIDATE_READ' as any),
      ).toBe(true);
    });

    it('should allow RECRUITER to CANDIDATE_CREATE', async () => {
      // RECRUITER role has CANDIDATE_CREATE
      expect(
        await service.hasPermission(
          '1',
          'RECRUITER',
          'CANDIDATE_CREATE' as any,
        ),
      ).toBe(true);
    });

    it('should not allow AM to CAMPAIGN_CREATE', async () => {
      // AM role doesn't have CAMPAIGN_CREATE
      expect(
        await service.hasPermission('1', 'AM', 'CAMPAIGN_CREATE' as any),
      ).toBe(false);
    });

    it('should allow RECRUITER to CAMPAIGN_CREATE', async () => {
      expect(
        await service.hasPermission('1', 'RECRUITER', 'CAMPAIGN_CREATE' as any),
      ).toBe(true);
    });

    it('should allow SM to PROPOSAL_CREATE', async () => {
      expect(
        await service.hasPermission('1', 'SM', 'PROPOSAL_CREATE' as any),
      ).toBe(true);
    });

    it('should allow AM to PROPOSAL_APPROVE', async () => {
      expect(
        await service.hasPermission('1', 'AM', 'PROPOSAL_APPROVE' as any),
      ).toBe(true);
    });
  });

  describe('isAllowedInterviewResult', () => {
    it('should allow SM to set SM_AM interview results', () => {
      expect(service.isAllowedInterviewResult('SM_AM_PASSED', 'SM')).toBe(true);
      expect(service.isAllowedInterviewResult('SM_AM_FAILED', 'SM')).toBe(true);
      expect(service.isAllowedInterviewResult('SM_AM_NO_SHOW', 'SM')).toBe(
        true,
      );
    });

    it('should not allow RECRUITER to set SM_AM results', () => {
      expect(
        service.isAllowedInterviewResult('SM_AM_PASSED', 'RECRUITER'),
      ).toBe(false);
    });

    it('should allow ADMIN to set all interview results', () => {
      expect(service.isAllowedInterviewResult('SM_AM_PASSED', 'ADMIN')).toBe(
        true,
      );
      expect(service.isAllowedInterviewResult('OM_PV_PASSED', 'ADMIN')).toBe(
        true,
      );
      expect(
        service.isAllowedInterviewResult('HR_INTERVIEW_PASSED', 'ADMIN'),
      ).toBe(true);
    });
  });

  describe('getAllowedInterviewResults', () => {
    it('should return interview results for SM', () => {
      const results = service.getAllowedInterviewResults('SM');
      const codes = results.map((r: any) => r.code);
      expect(codes).toContain('SM_AM_PASSED');
      expect(codes).toContain('SM_AM_FAILED');
      expect(codes).toContain('SM_AM_NO_SHOW');
    });

    it('should return interview results for ADMIN', () => {
      const results = service.getAllowedInterviewResults('ADMIN');
      const codes = results.map((r: any) => r.code);
      expect(codes.length).toBeGreaterThan(5);
    });
  });

  describe('getAllowedStatusTransitions', () => {
    it('should return transitions for ADMIN', () => {
      const transitions = service.getAllowedStatusTransitions(
        'ADMIN',
        'CV_FILTERING',
      );
      expect(transitions.length).toBeGreaterThan(0);
    });

    it('should return limited transitions for SM', () => {
      const transitions = service.getAllowedStatusTransitions(
        'SM',
        'HR_INTERVIEW_PASSED',
      );
      // SM can only set SM/AM interview results
      expect(transitions).toContain('SM_AM_INTERVIEW_PASSED');
      expect(transitions).toContain('SM_AM_INTERVIEW_FAILED');
      expect(transitions).toContain('SM_AM_NO_SHOW');
    });
  });

  describe('canPerformProposalAction', () => {
    it('should allow ADMIN to do all actions', () => {
      expect(service.canPerformProposalAction('ADMIN', 'create')).toBe(true);
      expect(service.canPerformProposalAction('ADMIN', 'approve')).toBe(true);
      expect(service.canPerformProposalAction('ADMIN', 'reject')).toBe(true);
    });

    it('should allow RECRUITER to do all actions', () => {
      expect(service.canPerformProposalAction('RECRUITER', 'create')).toBe(
        true,
      );
      expect(service.canPerformProposalAction('RECRUITER', 'approve')).toBe(
        true,
      );
    });

    it('should allow SM to create and submit proposals', () => {
      expect(service.canPerformProposalAction('SM', 'create')).toBe(true);
      expect(service.canPerformProposalAction('SM', 'submit')).toBe(true);
    });

    it('should not allow SM to approve proposals', () => {
      expect(service.canPerformProposalAction('SM', 'approve')).toBe(false);
    });

    it('should allow AM to review and approve proposals', () => {
      expect(service.canPerformProposalAction('AM', 'review')).toBe(true);
      expect(service.canPerformProposalAction('AM', 'approve')).toBe(true);
    });
  });

  describe('canManageOffer', () => {
    it('should allow ADMIN to manage offers', () => {
      expect(service.canManageOffer('ADMIN', 'create')).toBe(true);
      expect(service.canManageOffer('ADMIN', 'send')).toBe(true);
      expect(service.canManageOffer('ADMIN', 'delete')).toBe(true);
    });

    it('should allow RECRUITER to create and send offers', () => {
      expect(service.canManageOffer('RECRUITER', 'create')).toBe(true);
      expect(service.canManageOffer('RECRUITER', 'send')).toBe(true);
      expect(service.canManageOffer('RECRUITER', 'delete')).toBe(false);
    });

    it('should allow SM and AM to only read offers', () => {
      expect(service.canManageOffer('SM', 'read')).toBe(true);
      expect(service.canManageOffer('AM', 'read')).toBe(true);
      expect(service.canManageOffer('SM', 'create')).toBe(false);
    });
  });
});
