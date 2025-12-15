import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToTypes() {
  console.log('🔄 Migrating from enums to Type relations...');

  try {
    // First, seed types if not already seeded
    console.log('📦 Seeding types...');
    // This will be done by seed-types.ts first

    // Then migrate existing data
    console.log('🔄 Migrating candidates...');
    // Get default status type for candidates
    const defaultCandidateStatus = await prisma.type.findFirst({
      where: {
        category: { code: 'CANDIDATE_STATUS' },
        code: 'CV_FILTERING',
      },
    });

    if (defaultCandidateStatus) {
      await prisma.candidate.updateMany({
        where: { statusId: null },
        data: { statusId: defaultCandidateStatus.id },
      });
    }

    console.log('🔄 Migrating contracts...');
    const defaultContractType = await prisma.type.findFirst({
      where: {
        category: { code: 'CONTRACT_TYPE' },
        code: 'INDEFINITE',
      },
    });

    if (defaultContractType) {
      await prisma.contract.updateMany({
        where: { typeId: null },
        data: { typeId: defaultContractType.id },
      });
    }

    const defaultContractStatus = await prisma.type.findFirst({
      where: {
        category: { code: 'CONTRACT_STATUS' },
        code: 'ACTIVE',
      },
    });

    if (defaultContractStatus) {
      await prisma.contract.updateMany({
        where: { statusId: null },
        data: { statusId: defaultContractStatus.id },
      });
    }

    console.log('🔄 Migrating decisions...');
    const defaultDecisionType = await prisma.type.findFirst({
      where: {
        category: { code: 'DECISION_TYPE' },
        code: 'APPOINTMENT',
      },
    });

    if (defaultDecisionType) {
      await prisma.decision.updateMany({
        where: { typeId: null },
        data: { typeId: defaultDecisionType.id },
      });
    }

    const defaultDecisionStatus = await prisma.type.findFirst({
      where: {
        category: { code: 'DECISION_STATUS' },
        code: 'ACTIVE',
      },
    });

    if (defaultDecisionStatus) {
      await prisma.decision.updateMany({
        where: { statusId: null },
        data: { statusId: defaultDecisionStatus.id },
      });
    }

    console.log('🔄 Migrating interviews...');
    const defaultInterviewType = await prisma.type.findFirst({
      where: {
        category: { code: 'INTERVIEW_TYPE' },
        code: 'HR_SCREENING',
      },
    });

    if (defaultInterviewType) {
      await prisma.interview.updateMany({
        where: { typeId: null },
        data: { typeId: defaultInterviewType.id },
      });
    }

    console.log('🔄 Migrating requests...');
    const defaultRequestType = await prisma.type.findFirst({
      where: {
        category: { code: 'REQUEST_TYPE' },
        code: 'LEAVE',
      },
    });

    if (defaultRequestType) {
      await prisma.request.updateMany({
        where: { typeId: null },
        data: { typeId: defaultRequestType.id },
      });
    }

    const defaultRequestStatus = await prisma.type.findFirst({
      where: {
        category: { code: 'REQUEST_STATUS' },
        code: 'PENDING',
      },
    });

    if (defaultRequestStatus) {
      await prisma.request.updateMany({
        where: { statusId: null },
        data: { statusId: defaultRequestStatus.id },
      });
    }

    console.log('✅ Migration completed!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateToTypes();

