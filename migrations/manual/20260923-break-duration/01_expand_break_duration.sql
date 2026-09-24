-- MANUAL ONLY. Never imported/executed by application startup.
-- Requires the original 1..5 constraints, verified before execution.
-- Both tables change atomically; no rows are rewritten or deleted.
BEGIN;
SET LOCAL lock_timeout = '500ms';
SET LOCAL statement_timeout = '5s';

ALTER TABLE public.ritual_breaks
    ADD CONSTRAINT ritual_breaks_duration_1_15_check
        CHECK (break_duration_minutes BETWEEN 1 AND 15) NOT VALID,
    DROP CONSTRAINT ritual_breaks_break_duration_minutes_check;

ALTER TABLE public.mode_breaks
    ADD CONSTRAINT mode_breaks_duration_1_15_check
        CHECK (break_duration_minutes BETWEEN 1 AND 15) NOT VALID,
    DROP CONSTRAINT mode_breaks_break_duration_minutes_check;
COMMIT;
