alter table rituals
  add column if not exists is_protected boolean not null default false,
  add column if not exists nfc_unlock_enabled boolean not null default false,
  add column if not exists password_hash text null;

alter table rituals
  drop constraint if exists rituals_protected_password_check;

alter table rituals
  add constraint rituals_protected_password_check
  check (
    (is_protected = false and password_hash is null)
    or
    (is_protected = true and password_hash is not null)
  );
