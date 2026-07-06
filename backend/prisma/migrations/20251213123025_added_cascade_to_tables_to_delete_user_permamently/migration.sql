-- User deletion system with referral point reversal

-- Add referral reversal trigger
CREATE OR REPLACE FUNCTION handle_referral_reversal()
RETURNS TRIGGER AS $$
DECLARE
  referral_record RECORD;
  days_since_reward NUMERIC;
  current_balance RECORD;
  actual_deduction INTEGER;
BEGIN
  -- Find completed referral for deleted user
  SELECT r.*, ru.email as referred_email
  INTO referral_record
  FROM "Referral" r
  JOIN "User" ru ON r."referredUserId" = ru.id
  WHERE r."referredUserId" = OLD.id AND r."isCompleted" = true;

  -- Exit if no completed referral found
  IF NOT FOUND THEN
    RETURN OLD;
  END IF;

  -- Check if within 30-day grace period
  days_since_reward := EXTRACT(EPOCH FROM (NOW() - referral_record."updatedAt")) / 86400;
  
  IF days_since_reward <= 30 THEN
    -- Get current balance
    SELECT "totalPoints", "availablePoints"
    INTO current_balance
    FROM "UserPointBalance"
    WHERE "userId" = referral_record."referrerId";

    -- Calculate actual deduction (prevent negative balance)
    actual_deduction := LEAST(referral_record."pointsAwarded", current_balance."availablePoints");

    IF actual_deduction > 0 THEN
      -- Update point balance
      UPDATE "UserPointBalance" 
      SET "totalPoints" = "totalPoints" - actual_deduction,
          "availablePoints" = "availablePoints" - actual_deduction,
          "updatedAt" = NOW()
      WHERE "userId" = referral_record."referrerId";

      -- Create penalty transaction
      INSERT INTO "PointTransaction" (
        id, "userId", type, amount, description, 
        "referenceId", "referenceType", "balanceBefore", "balanceAfter", "createdAt"
      )
      VALUES (
        gen_random_uuid(), 
        referral_record."referrerId", 
        'PENALTY', 
        -actual_deduction,
        'Referral reversed - ' || referral_record.referred_email || ' deleted account',
        referral_record.id,
        'REFERRAL_REVERSAL',
        current_balance."availablePoints",
        current_balance."availablePoints" - actual_deduction,
        NOW()
      );

      RAISE NOTICE 'Reversed % referral points for user deletion within grace period', actual_deduction;
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS referral_reversal_trigger ON "User";
CREATE TRIGGER referral_reversal_trigger
  BEFORE DELETE ON "User"
  FOR EACH ROW
  EXECUTE FUNCTION handle_referral_reversal();

-- Add user deletion function
CREATE OR REPLACE FUNCTION delete_user_by_email(user_email TEXT)
RETURNS VOID AS $$
DECLARE
    user_id TEXT;
BEGIN
    -- Find user by email
    SELECT id INTO user_id FROM "User" WHERE email = user_email;
    
    -- Exit if user doesn't exist
    IF user_id IS NULL THEN
        RETURN;
    END IF;
    
    -- Delete user (trigger will handle referral point reversal, CASCADE will handle all related data)
    DELETE FROM "User" WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON FUNCTION delete_user_by_email(TEXT) IS 'Deletes user and all related data with referral point reversal within 30-day grace period';
