import { Test, TestingModule } from '@nestjs/testing';
import { StatusTransitionService } from './status-transition.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import { CampaignFulfillmentService } from './campaign-fulfillment.service';

describe('StatusTransitionService', () => {
  let service: StatusTransitionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusTransitionService,
        {
          provide: PrismaService,
          useValue: {
            candidate: {
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
            },
            candidateStatus: {
              findUnique: jest.fn(),
              findMany: jest.fn(),
            },
            candidateSLALog: {
              findFirst: jest.fn(),
              update: jest.fn(),
              create: jest.fn(),
            },
            interview: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn().mockResolvedValue(undefined),
            getAuditLogs: jest.fn().mockResolvedValue([]),
          },
        },
        {
          provide: CampaignFulfillmentService,
          useValue: {
            updateCampaignFulfillment: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<StatusTransitionService>(StatusTransitionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllowedTransitions', () => {
    it('should return allowed transitions for ADMIN from CV_FILTERING', () => {
      const transitions = service.getAllowedTransitions(
        'CV_FILTERING',
        'ADMIN',
      );
      expect(transitions).toBeDefined();
      expect(Array.isArray(transitions)).toBe(true);
    });

    it('should return empty transitions for invalid status', () => {
      const transitions = service.getAllowedTransitions(
        'INVALID_STATUS',
        'ADMIN',
      );
      expect(transitions).toBeDefined();
      expect(Array.isArray(transitions)).toBe(true);
    });

    it('should limit transitions for SM role', () => {
      const transitions = service.getAllowedTransitions(
        'HR_INTERVIEW_PASSED',
        'SM',
      );
      expect(transitions).toBeDefined();
      // SM should only be able to set SM/AM interview results
      expect(transitions).toContain('SM_AM_INTERVIEW_PASSED');
      expect(transitions).toContain('SM_AM_INTERVIEW_FAILED');
      expect(transitions).toContain('SM_AM_NO_SHOW');
    });

    it('should limit transitions for AM role', () => {
      const transitions = service.getAllowedTransitions(
        'SM_AM_INTERVIEW_PASSED',
        'AM',
      );
      expect(transitions).toBeDefined();
      // AM can set OM interview results
      expect(transitions).toContain('OM_PV_INTERVIEW_PASSED');
      expect(transitions).toContain('OM_PV_INTERVIEW_FAILED');
      expect(transitions).toContain('OM_PV_NO_SHOW');
    });
  });

  describe('getStatusGroups', () => {
    it('should return status groups', () => {
      const groups = service.getStatusGroups();
      expect(groups).toBeDefined();
      expect(Array.isArray(groups)).toBe(true);
      expect(groups.length).toBeGreaterThan(0);
    });

    it('should have application, interview, offer, onboarding groups', () => {
      const groups = service.getStatusGroups();
      const groupKeys = groups.map((g) => g.key);
      expect(groupKeys).toContain('application');
      expect(groupKeys).toContain('interview');
      expect(groupKeys).toContain('offer');
      expect(groupKeys).toContain('onboarding');
    });
  });

  describe('canTransition', () => {
    it('should return true for valid transition', () => {
      const canTransition = service.canTransition(
        'CV_FILTERING',
        'WAITING_INTERVIEW',
        'ADMIN',
      );
      expect(canTransition).toBe(true);
    });

    it('should return false for invalid transition', () => {
      // Can't go from ONBOARDING_ACCEPTED back to CV_FILTERING
      const canTransition = service.canTransition(
        'ONBOARDING_ACCEPTED',
        'CV_FILTERING',
        'ADMIN',
      );
      expect(canTransition).toBe(false);
    });
  });
});
