-- Run only after 01_expand_break_duration.sql commits successfully.
-- Validation scans existing rows without the ACCESS EXCLUSIVE lock of ALTER ADD.
-- New inserts/updates are already checked by the NOT VALID constraints.
BEGIN;
SET LOCAL lock_timeout = '500ms';
SET LOCAL statement_timeout = '30s';
ALTER TABLE public.ritual_breaks VALIDATE CONSTRAINT ritual_breaks_duration_1_15_check;
ALTER TABLE public.mode_breaks VALIDATE CONSTRAINT mode_breaks_duration_1_15_check;
COMMIT;
