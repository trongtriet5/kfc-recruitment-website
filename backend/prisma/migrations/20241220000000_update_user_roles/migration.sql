-- Migration to update UserRole enum
-- Step 1: Update existing data before changing enum
UPDATE "users" SET role = 'HEAD_OF_DEPARTMENT' WHERE role = 'HR';
UPDATE "users" SET role = 'USER' WHERE role = 'EMPLOYEE';

-- Step 2: Add new enum values to UserRole enum
-- PostgreSQL requires adding enum values in a transaction
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

-- Note: Old enum values (HR, EMPLOYEE) cannot be removed from PostgreSQL enum types
-- They will remain but should not be used in new records

