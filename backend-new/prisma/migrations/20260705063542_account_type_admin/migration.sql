-- Add ADMIN to the AccountType enum (separate migration so the value is
-- committed before any migration UPDATE references it).
ALTER TYPE "AccountType" ADD VALUE IF NOT EXISTS 'ADMIN';
