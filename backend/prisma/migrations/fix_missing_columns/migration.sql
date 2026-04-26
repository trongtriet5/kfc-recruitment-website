-- Migration: Add missing columns to synchronize database with Prisma schema
-- Created: 2026-04-26

-- 1. Add missing columns to campaigns table
ALTER TABLE "campaigns"
ADD COLUMN IF NOT EXISTS "targetQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "fulfilledQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "hiredQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "offerAcceptedQty" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- 2. Add missing columns to recruitment_proposals table
ALTER TABLE "recruitment_proposals"
ADD COLUMN IF NOT EXISTS "businessReason" TEXT,
ADD COLUMN IF NOT EXISTS "replacementFor" TEXT,
ADD COLUMN IF NOT EXISTS "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN IF NOT EXISTS "budget" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "targetJoinDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "isUnplanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "requestedById" TEXT,
ADD COLUMN IF NOT EXISTS "amReviewedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "hrAssignedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "approverId" TEXT,
ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
ADD COLUMN IF NOT EXISTS "cancelledAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "cancelledById" TEXT,
ADD COLUMN IF NOT EXISTS "campaignId" TEXT,
ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "isUntilFilled" BOOLEAN NOT NULL DEFAULT false;

-- 3. Add missing column to interviews table
ALTER TABLE "interviews"
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "location" TEXT,
ADD COLUMN IF NOT EXISTS "rating" INTEGER;

-- 4. Add missing column to candidate_statuses table
ALTER TABLE "candidate_statuses"
ADD COLUMN IF NOT EXISTS "slaHours" INTEGER;

-- 5. Add missing columns to candidates table (SLA & Priority fields)
ALTER TABLE "candidates"
ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'NORMAL',
ADD COLUMN IF NOT EXISTS "slaDueDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "slaBreachFlag" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "blacklistedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "blacklistReason" TEXT,
ADD COLUMN IF NOT EXISTS "blacklistId" TEXT;

-- Add foreign key constraint for candidates.blacklistId -> blacklists.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'candidates_blacklistId_fkey'
    ) THEN
        ALTER TABLE "candidates"
        ADD CONSTRAINT "candidates_blacklistId_fkey"
        FOREIGN KEY ("blacklistId") REFERENCES "blacklists"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for recruitment_proposals.approverId -> users.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_proposals_approverId_fkey'
    ) THEN
        ALTER TABLE "recruitment_proposals"
        ADD CONSTRAINT "recruitment_proposals_approverId_fkey"
        FOREIGN KEY ("approverId") REFERENCES "users"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Add foreign key constraint for recruitment_proposals.campaignId -> campaigns.id
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'recruitment_proposals_campaignId_fkey'
    ) THEN
        ALTER TABLE "recruitment_proposals"
        ADD CONSTRAINT "recruitment_proposals_campaignId_fkey"
        FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

