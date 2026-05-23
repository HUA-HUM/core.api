create table if not exists ritual_blocked_items (
  id uuid primary key default gen_random_uuid(),
  ritual_id uuid not null references rituals(id) on delete cascade,
  type text not null check (type in ('app', 'category', 'domain')),
  identifier text not null,
  display_name text,
  bundle_identifier text,
  created_at timestamptz not null default now(),
  unique (ritual_id, type, identifier)
);

create index if not exists idx_ritual_blocked_items_ritual_id
  on ritual_blocked_items (ritual_id);
