-- Fix phone unique constraint to allow multiple NULL/empty values
-- but enforce uniqueness for actual phone numbers

-- Step 1: Clean up empty strings - convert to NULL (MUST BE FIRST!)
UPDATE "User" SET phone = NULL WHERE phone = '' OR phone IS NULL;

-- Step 2: Drop existing unique constraint if exists
DROP INDEX IF EXISTS "User_phone_key";

-- Step 3: Create partial unique index (only for non-NULL, non-empty phones)
CREATE UNIQUE INDEX "User_phone_key" ON "User"(phone) 
WHERE phone IS NOT NULL AND phone != '';
