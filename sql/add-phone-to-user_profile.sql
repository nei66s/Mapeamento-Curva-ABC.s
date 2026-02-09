-- Migration: add phone column to user_profile
ALTER TABLE user_profile
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Optional: set sample phone for a user (replace user_id as needed)
-- UPDATE user_profile SET phone = '123' WHERE user_id = '<USER_ID>';

-- Verify
-- SELECT user_id, phone FROM user_profile LIMIT 50;
