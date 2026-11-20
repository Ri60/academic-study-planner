BEGIN;

ALTER TABLE planner_account
DROP CONSTRAINT IF EXISTS planner_account_role_check;

ALTER TABLE planner_account
ADD CONSTRAINT planner_account_role_check
CHECK (role IN ('admin', 'user', 'guest'));

COMMIT;