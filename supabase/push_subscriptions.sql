-- Push subscriptions table
create table if not exists push_subscriptions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  subscription jsonb not null,
  created_at   timestamptz not null default now()
);

-- Unique index on the endpoint URL inside the jsonb (the true device identifier)
create unique index if not exists push_subscriptions_user_endpoint_idx
  on push_subscriptions (user_id, (subscription->>'endpoint'));

-- RLS
alter table push_subscriptions enable row level security;

create policy "Users can manage their own subscriptions"
  on push_subscriptions
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
