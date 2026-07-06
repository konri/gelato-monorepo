-- Backfill: existing admin-role users move to the ADMIN account namespace so
-- they log in against the admin web app (and don't collide with client emails).
UPDATE "User"
SET "accountType" = 'ADMIN'
WHERE ('SUPER_ADMIN' = ANY("roles")
    OR 'SPOTS_ADMIN' = ANY("roles")
    OR 'SPOT_ADMIN'  = ANY("roles")
    OR 'EMPLOYEE'    = ANY("roles"))
  AND "accountType" = 'CLIENT';
