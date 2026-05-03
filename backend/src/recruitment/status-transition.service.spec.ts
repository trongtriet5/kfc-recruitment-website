import { Test, TestingModule } from '@nestjs/testing';
import { StatusTransitionService } from './status-transition.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

describe('StatusTransitionService', () => {
  let service: StatusTransitionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatusTransitionService,
        {
          provide: PrismaService,
          useValue: {
            candidate: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn() },
            candidateStatus: { findUnique: jest.fn() },
            candidateSLALog: { findFirst: jest.fn(), update: jest.fn(), create: jest.fn() },
          },
        },
        {
          provide: AuditService,
          useValue: { log: jest.fn() },
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
      const transitions = service.getAllowedTransitions('CV_FILTERING', 'ADMIN');
      expect(transitions).toContain('WAITING_INTERVIEW');
      expect(transitions).not.toContain('CV_PASSED');
    });

    it('should limit transitions for SM', () => {
      const transitions = service.getAllowedTransitions('WAITING_INTERVIEW', 'SM');
      expect(transitions).not.toContain('HR_INTERVIEW_PASSED'); // Not allowed for SM
    });
  });

  describe('checkSlaBreaches', () => {
    it('should be defined', () => {
      expect(service.checkSlaBreaches).toBeDefined();
    });
  });
});
