//wallet
create table public.wallet_analyses (
  wallet_address text primary key,
  trust_score integer not null,
  risk_level text not null,
  confidence numeric not null default 0,
  behavioral_metrics jsonb not null default '{}'::jsonb,
  suspicious_flags jsonb not null default '[]'::jsonb,
  ai_insights jsonb not null default '[]'::jsonb,
  risk_predictions jsonb not null default '[]'::jsonb,
  analytics jsonb not null default '{}'::jsonb,
  recent_activity jsonb not null default '[]'::jsonb,
  reputation_history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.wallet_analyses enable row level security;

create policy "anyone can view wallet analyses"
  on public.wallet_analyses for select
  using (true);

create policy "anyone can insert wallet analyses"
  on public.wallet_analyses for insert
  with check (true);

create policy "anyone can update wallet analyses"
  on public.wallet_analyses for update
  using (true);

create index wallet_analyses_trust_score_idx on public.wallet_analyses (trust_score desc);
create index wallet_analyses_updated_at_idx on public.wallet_analyses (updated_at desc);

create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  owner_wallet text not null,
  name text not null,
  key_prefix text not null,
  key_hash text not null,
  request_count integer not null default 0,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.api_keys enable row level security;

create policy "anyone can view api keys"
  on public.api_keys for select
  using (true);
create policy "anyone can insert api keys"
  on public.api_keys for insert
  with check (true);
create policy "anyone can delete api keys"
  on public.api_keys for delete
  using (true);

create index api_keys_owner_idx on public.api_keys (owner_wallet);

create table public.user_settings (
  wallet_address text primary key,
  notify_alerts boolean not null default true,
  notify_score_changes boolean not null default true,
  theme text not null default 'dark',
  updated_at timestamptz not null default now()
);

alter table public.user_settings enable row level security;

create policy "anyone can view settings"
  on public.user_settings for select
  using (true);
create policy "anyone can upsert settings"
  on public.user_settings for insert
  with check (true);
create policy "anyone can update settings"
  on public.user_settings for update
  using (true);
