import { Test, TestingModule } from '@nestjs/testing';
import { RbacService } from './rbac.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

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
    it('should allow ADMIN to CANDIDATE_CREATE', () => {
      expect(service.hasPermission('ADMIN', 'CANDIDATE_CREATE')).toBe(true);
    });

    it('should not allow USER to CANDIDATE_CREATE', () => {
      expect(service.hasPermission('USER', 'CANDIDATE_CREATE')).toBe(false);
    });

    it('should allow USER to CANDIDATE_READ', () => {
      expect(service.hasPermission('USER', 'CANDIDATE_READ')).toBe(true);
    });
  });

  describe('assertPermission', () => {
    it('should not throw if permission exists', () => {
      expect(() => service.assertPermission('ADMIN', 'CANDIDATE_CREATE')).not.toThrow();
    });

    it('should throw ForbiddenException if permission missing', () => {
      expect(() => service.assertPermission('USER', 'CANDIDATE_CREATE')).toThrow(ForbiddenException);
    });
  });
});
