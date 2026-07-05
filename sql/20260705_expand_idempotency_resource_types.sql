alter table idempotency_operations
  drop constraint if exists idempotency_operations_resource_type_check;

alter table idempotency_operations
  add constraint idempotency_operations_resource_type_check
  check (
    resource_type in (
      'ritual_session',
      'mode_session',
      'ritual',
      'mode',
      'ritual_blocked_items',
      'mode_blocked_items'
    )
  );
