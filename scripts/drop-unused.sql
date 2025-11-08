-- Drop legacy/unused tables safely. Adjust as needed for your environment.
BEGIN;

-- Legacy settlements table (replaced by settlement_letters)
DROP TABLE IF EXISTS settlements;

COMMIT;

