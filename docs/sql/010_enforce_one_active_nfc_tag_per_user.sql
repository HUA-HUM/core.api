with ranked_active_claims as (
  select
    id,
    row_number() over (
      partition by user_id
      order by claimed_at desc, created_at desc, id desc
    ) as position
  from nfc_tag_claims
  where status = 'active'
)
update nfc_tag_claims claims
set
  status = 'revoked',
  updated_at = now()
from ranked_active_claims ranked
where claims.id = ranked.id
  and ranked.position > 1;

create unique index if not exists nfc_tag_claims_one_active_per_user_idx
  on nfc_tag_claims (user_id)
  where status = 'active';
