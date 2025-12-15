-- Fix UserRole enum by adding new values first
-- Run this SQL directly in your database before running seed

-- Step 1: Add new enum values to UserRole enum
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'HEAD_OF_DEPARTMENT' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')) THEN
        ALTER TYPE "UserRole" ADD VALUE 'HEAD_OF_DEPARTMENT';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUPERVISOR' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')) THEN
        ALTER TYPE "UserRole" ADD VALUE 'SUPERVISOR';
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'USER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')) THEN
        ALTER TYPE "UserRole" ADD VALUE 'USER';
    END IF;
END $$;

-- Step 2: Update existing data
UPDATE "users" SET role = 'HEAD_OF_DEPARTMENT' WHERE role = 'HR';
UPDATE "users" SET role = 'USER' WHERE role = 'EMPLOYEE';

