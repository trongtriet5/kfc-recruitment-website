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
    it('should allow ADMIN to CANDIDATE_CREATE', async () => {
      // Mock findUnique to return null to test fallback
      (service as any).prisma.user = { findUnique: jest.fn().mockResolvedValue(null) };
      expect(await service.hasPermission('1', 'ADMIN', 'CANDIDATE_CREATE' as any)).toBe(true);
    });

    it('should not allow USER to CANDIDATE_CREATE', async () => {
      (service as any).prisma.user = { findUnique: jest.fn().mockResolvedValue(null) };
      expect(await service.hasPermission('1', 'USER', 'CANDIDATE_CREATE' as any)).toBe(false);
    });

    it('should allow USER to CANDIDATE_READ', async () => {
      (service as any).prisma.user = { findUnique: jest.fn().mockResolvedValue(null) };
      expect(await service.hasPermission('1', 'USER', 'CANDIDATE_READ' as any)).toBe(true);
    });
  });

  describe('assertPermission', () => {
    it('should not throw if permission exists', async () => {
      jest.spyOn(service, 'hasPermission').mockResolvedValue(true);
      await expect(service.assertPermission('1', 'ADMIN', 'CANDIDATE_CREATE' as any)).resolves.not.toThrow();
    });

    it('should throw ForbiddenException if permission missing', async () => {
      jest.spyOn(service, 'hasPermission').mockResolvedValue(false);
      await expect(service.assertPermission('1', 'USER', 'CANDIDATE_CREATE' as any)).rejects.toThrow(ForbiddenException);
    });
  });
});
