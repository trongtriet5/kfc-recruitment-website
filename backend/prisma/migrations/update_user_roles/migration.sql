-- Migration to update UserRole enum
-- This migration updates existing roles to new role system

-- First, update existing HR role to HEAD_OF_DEPARTMENT
UPDATE users SET role = 'HEAD_OF_DEPARTMENT' WHERE role = 'HR';

-- Update existing EMPLOYEE role to USER
UPDATE users SET role = 'USER' WHERE role = 'EMPLOYEE';

-- Note: The enum change itself needs to be done via Prisma migrate
-- Run: npx prisma migrate dev --name update_user_roles

