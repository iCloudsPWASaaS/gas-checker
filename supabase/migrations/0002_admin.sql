-- Gas Checker - admin management upgrade
-- Run this after 0001_init.sql in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Plans: optional Stripe price IDs so admins can add or edit plans in-app
-- ---------------------------------------------------------------------------
alter table "gas-checker".plans
  add column if not exists stripe_price_monthly text,
  add column if not exists stripe_price_yearly text;

comment on column "gas-checker".plans.stripe_price_monthly is 'Stripe Price ID used for monthly checkout. Falls back to STRIPE_PRICE_* environment variables.';
comment on column "gas-checker".plans.stripe_price_yearly is 'Stripe Price ID used for yearly checkout. Falls back to STRIPE_PRICE_* environment variables.';

-- ---------------------------------------------------------------------------
-- Platform settings (single row)
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".platform_settings (
  id smallint primary key default 1 check (id = 1),
  support_email text,
  default_currency text not null default 'GBP',
  trial_days integer not null default 30 check (trial_days between 0 and 365),
  signup_enabled boolean not null default true,
  announcement text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into "gas-checker".platform_settings (id)
values (1)
on conflict (id) do nothing;

drop trigger if exists set_updated_at on "gas-checker".platform_settings;
create trigger set_updated_at before update on "gas-checker".platform_settings
  for each row execute function "gas-checker".set_updated_at();

-- ---------------------------------------------------------------------------
-- Admin audit log
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  admin_email text,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_created_idx on "gas-checker".admin_audit_log(created_at desc);
create index if not exists admin_audit_entity_idx on "gas-checker".admin_audit_log(entity_type, entity_id);

-- These tables are server-only. RLS is enabled with no policies and direct
-- anon/authenticated grants are removed; the service role bypasses RLS.
alter table "gas-checker".platform_settings enable row level security;
alter table "gas-checker".admin_audit_log enable row level security;

revoke all on "gas-checker".platform_settings from anon, authenticated;
revoke all on "gas-checker".admin_audit_log from anon, authenticated;

grant all on "gas-checker".platform_settings to service_role;
grant all on "gas-checker".admin_audit_log to service_role;
