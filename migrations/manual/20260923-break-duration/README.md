# Manual break-duration migration

This migration expands durations from 1–5 to 1–15 minutes for existing tables.
Application startup does not run it. Backend validation changes require a separate deployment.

1. Confirm the database/schema and old constraint names using pg_constraint. Do not run against an unverified target.
2. Schedule a brief low-traffic window. Run 01_expand_break_duration.sql as one complete batch. It requests exclusive table locks but avoids a full table scan; it aborts after 500 ms of lock waiting or 5 seconds of statement execution. On an error, issue ROLLBACK and investigate rather than repeatedly retrying under load.
3. After successful commit, run 02_validate_break_duration.sql. NOT VALID still enforces the rule on new inserts/updates; this second step validates old rows. If validation times out, the 1–15 rule remains enforced for new writes, and the validation can be retried later.
4. Inspect pg_constraint: both duration constraints must be validated and permit 1–15. Count constraints (0–3), primary keys and foreign keys remain unchanged.
5. Deploy the compatible backend separately after checking availability/rollback behavior of the hosting platform. Existing clients sending 1–5 remain compatible.

The migration is intentionally not silently repeatable: an unexpected/missing constraint aborts the first transaction. Do not drop unknown constraints to force it through.

Returning to 1–5 after accepting values above 5 requires an explicit data/product decision. No destructive rollback is provided.

Local validation uses a new PostgreSQL cluster, a private Unix socket, no TCP listener, invented data and an environment that excludes production connection variables. See HolaSwift/Tests/run_break_migration.py in the adjacent repository for reproducible tests. Local timings do not predict production load, lock duration or deployment downtime.

## Production execution record

On 2026-09-24 the operator ran both scripts in Neon production and supplied the resulting pg_constraint rows: ritual_breaks_duration_1_15_check and mode_breaks_duration_1_15_check both allow 1–15 and are validated. Do not rerun the expansion on that database. The existing mode_sessions end_source and app_update_configurations platform checks were also confirmed validated with schedule and ios/android respectively. Their repetitive startup DROP/ADD operations were removed from the accompanying backend release. Older installations must migrate those checks manually before using this release. A backend rollback leaves the 1–15 database checks in place, but restoring the old commit also restores its previous startup DDL.
