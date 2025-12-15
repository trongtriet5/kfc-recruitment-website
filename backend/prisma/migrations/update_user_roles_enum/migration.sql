-- Migration to update UserRole enum
-- Step 1: Update existing data
UPDATE users SET role = 'HEAD_OF_DEPARTMENT' WHERE role = 'HR';
UPDATE users SET role = 'USER' WHERE role = 'EMPLOYEE';

-- Step 2: Alter enum type to add new values
-- First, add new enum values
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'HEAD_OF_DEPARTMENT';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'SUPERVISOR';
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'USER';

-- Note: PostgreSQL doesn't support removing enum values directly
-- Old values (HR, EMPLOYEE) will remain but should not be used

