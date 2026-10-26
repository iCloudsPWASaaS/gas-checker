-- Gas Checker SaaS - Supabase setup
-- Run this in Supabase Dashboard > SQL Editor (project: idartbhlcbsefuhuvovs)
-- Schema: "gas-checker"   Storage bucket: gas-checker

create extension if not exists "pgcrypto";

create schema if not exists "gas-checker";

grant usage on schema "gas-checker" to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Plans
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".plans (
  id text primary key,
  name text not null,
  description text,
  monthly_price numeric(10,2) not null default 0,
  yearly_price numeric(10,2) not null default 0,
  currency text not null default 'GBP',
  features jsonb not null default '[]'::jsonb,
  max_users integer not null default 1,
  max_reports integer,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into "gas-checker".plans (id, name, description, monthly_price, yearly_price, currency, features, max_users, max_reports, sort_order)
values
  ('starter', 'Starter', 'For sole gas engineers getting started.', 9.99, 99.00, 'GBP',
   '["Unlimited certificates","Invoices & quotes","Schedule & reminders","Gas rate calculator","Cloud backup"]'::jsonb, 1, null, 1),
  ('pro', 'Professional', 'Everything a growing heating business needs.', 19.99, 199.00, 'GBP',
   '["Everything in Starter","Unlimited contacts","Payment tracking","Branded PDF certificates","Priority support"]'::jsonb, 3, null, 2),
  ('business', 'Business', 'For teams of engineers and office staff.', 34.99, 349.00, 'GBP',
   '["Everything in Professional","Up to 10 team members","Company-wide reporting","Dedicated onboarding"]'::jsonb, 10, null, 3)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  monthly_price = excluded.monthly_price,
  yearly_price = excluded.yearly_price,
  features = excluded.features,
  max_users = excluded.max_users,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  company_name text,
  phone text,
  avatar_url text,
  gas_safe_id text,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Subscriptions
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  plan_id text not null references "gas-checker".plans(id),
  status text not null default 'trialing'
    check (status in ('trialing','active','past_due','canceled','expired','incomplete')),
  billing_interval text not null default 'monthly'
    check (billing_interval in ('monthly','yearly')),
  trial_start timestamptz,
  trial_end timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Company / app settings
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  company_name text,
  company_address_line1 text,
  company_address_line2 text,
  company_address_line3 text,
  postcode text,
  phone text,
  email text,
  gas_engineer_id text,
  engineer_position text,
  engineer_signature_url text,
  email_message text default 'Hi, here is your gas safety certificate.',
  email_cc text,
  email_bcc text,
  certificate_prefix text default 'GC',
  invoice_prefix text default 'INV',
  quote_prefix text default 'QT',
  currency text not null default 'GBP',
  vat_rate numeric(5,2) not null default 0,
  auto_sync boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Contacts
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  address_line1 text,
  address_line2 text,
  address_line3 text,
  postcode text,
  type text not null default 'client' check (type in ('client','installation','supplier')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_user_id_idx on "gas-checker".contacts(user_id);
create index if not exists contacts_name_idx on "gas-checker".contacts(user_id, name);

-- ---------------------------------------------------------------------------
-- Documents (quotes & invoices)
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('invoice','quote')),
  number text not null,
  status text not null default 'draft'
    check (status in ('draft','sent','partially_paid','paid','overdue','accepted','declined','expired','cancelled')),
  client_contact_id uuid references "gas-checker".contacts(id) on delete set null,
  client_name text not null,
  client_address_line1 text,
  client_address_line2 text,
  client_address_line3 text,
  client_postcode text,
  client_phone text,
  client_email text,
  installation_name text,
  installation_address_line1 text,
  installation_address_line2 text,
  installation_address_line3 text,
  installation_postcode text,
  installation_phone text,
  installation_email text,
  issue_date date not null default current_date,
  due_date date,
  valid_until date,
  subtotal numeric(12,2) not null default 0,
  tax_rate numeric(5,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,
  notes text,
  terms text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type, number)
);

create index if not exists documents_user_type_idx on "gas-checker".documents(user_id, type);
create index if not exists documents_status_idx on "gas-checker".documents(user_id, type, status);

create table if not exists "gas-checker".document_items (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references "gas-checker".documents(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  description text not null,
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  amount numeric(12,2) not null default 0,
  sort_order integer not null default 0
);

create index if not exists document_items_document_idx on "gas-checker".document_items(document_id);

create table if not exists "gas-checker".payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid not null references "gas-checker".documents(id) on delete cascade,
  amount numeric(12,2) not null,
  method text not null default 'cash' check (method in ('cash','cheque','card','bank','izettle','other')),
  reference text,
  paid_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists payments_document_idx on "gas-checker".payments(document_id);
create index if not exists payments_user_idx on "gas-checker".payments(user_id);

-- ---------------------------------------------------------------------------
-- Schedule / appointments
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  location text,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  repeat_rule text default 'never',
  alert_minutes integer,
  url text,
  contact_id uuid references "gas-checker".contacts(id) on delete set null,
  status text not null default 'scheduled' check (status in ('scheduled','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists appointments_user_start_idx on "gas-checker".appointments(user_id, starts_at);

-- ---------------------------------------------------------------------------
-- Reminders
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  kind text not null default 'custom' check (kind in ('gas_report','invoice','custom')),
  due_date date,
  status text not null default 'pending' check (status in ('pending','done','dismissed')),
  entity_type text,
  entity_id uuid,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists reminders_user_idx on "gas-checker".reminders(user_id, status);

-- ---------------------------------------------------------------------------
-- Gas reports / certificates
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".gas_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  reference text,
  certificate_number text,
  job_id text,
  status text not null default 'draft' check (status in ('draft','in_progress','completed','cancelled')),
  contact_id uuid references "gas-checker".contacts(id) on delete set null,
  property_name text,
  property_address_line1 text,
  property_address_line2 text,
  property_address_line3 text,
  property_postcode text,
  appliances jsonb not null default '[]'::jsonb,
  defects jsonb not null default '[]'::jsonb,
  readings jsonb not null default '{}'::jsonb,
  notes text,
  pdf_url text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gas_reports_user_idx on "gas-checker".gas_reports(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Gas rate calculator history
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".gas_rate_calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meter_type text not null check (meter_type in ('metric','imperial')),
  reading1 numeric(12,3),
  reading2 numeric(12,3),
  seconds integer,
  gas_rate_m3_hr numeric(12,3),
  gross_kw numeric(12,3),
  net_kw numeric(12,3),
  created_at timestamptz not null default now()
);

create index if not exists gas_rate_user_idx on "gas-checker".gas_rate_calculations(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Backups & device tokens
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".backups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_path text not null,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create table if not exists "gas-checker".device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null,
  platform text not null default 'android' check (platform in ('android','ios','web')),
  created_at timestamptz not null default now(),
  unique (user_id, token)
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function "gas-checker".set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','subscriptions','settings','contacts','documents','appointments','reminders','gas_reports']
  loop
    execute format('drop trigger if exists set_updated_at on "gas-checker".%I', t);
    execute format('create trigger set_updated_at before update on "gas-checker".%I for each row execute function "gas-checker".set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table "gas-checker".plans enable row level security;
alter table "gas-checker".profiles enable row level security;
alter table "gas-checker".subscriptions enable row level security;
alter table "gas-checker".settings enable row level security;
alter table "gas-checker".contacts enable row level security;
alter table "gas-checker".documents enable row level security;
alter table "gas-checker".document_items enable row level security;
alter table "gas-checker".payments enable row level security;
alter table "gas-checker".appointments enable row level security;
alter table "gas-checker".reminders enable row level security;
alter table "gas-checker".gas_reports enable row level security;
alter table "gas-checker".gas_rate_calculations enable row level security;
alter table "gas-checker".backups enable row level security;
alter table "gas-checker".device_tokens enable row level security;

drop policy if exists "plans are public" on "gas-checker".plans;
create policy "plans are public" on "gas-checker".plans for select using (true);

do $$
declare t text;
begin
  foreach t in array array['profiles','subscriptions','settings','contacts','documents','document_items','payments','appointments','reminders','gas_reports','gas_rate_calculations','backups','device_tokens']
  loop
    execute format('drop policy if exists "owner select" on "gas-checker".%I', t);
    execute format('drop policy if exists "owner insert" on "gas-checker".%I', t);
    execute format('drop policy if exists "owner update" on "gas-checker".%I', t);
    execute format('drop policy if exists "owner delete" on "gas-checker".%I', t);

    if t = 'profiles' then
      execute format('create policy "owner select" on "gas-checker".%I for select using (id = (select auth.uid()))', t);
      execute format('create policy "owner insert" on "gas-checker".%I for insert with check (id = (select auth.uid()))', t);
      execute format('create policy "owner update" on "gas-checker".%I for update using (id = (select auth.uid())) with check (id = (select auth.uid()))', t);
      execute format('create policy "owner delete" on "gas-checker".%I for delete using (id = (select auth.uid()))', t);
    elsif t = 'document_items' then
      execute format('create policy "owner select" on "gas-checker".%I for select using (user_id = (select auth.uid()))', t);
      execute format('create policy "owner insert" on "gas-checker".%I for insert with check (user_id = (select auth.uid()))', t);
      execute format('create policy "owner update" on "gas-checker".%I for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
      execute format('create policy "owner delete" on "gas-checker".%I for delete using (user_id = (select auth.uid()))', t);
    else
      execute format('create policy "owner select" on "gas-checker".%I for select using (user_id = (select auth.uid()))', t);
      execute format('create policy "owner insert" on "gas-checker".%I for insert with check (user_id = (select auth.uid()))', t);
      execute format('create policy "owner update" on "gas-checker".%I for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
      execute format('create policy "owner delete" on "gas-checker".%I for delete using (user_id = (select auth.uid()))', t);
    end if;
  end loop;
end $$;

-- Explicit API grants
grant all on all tables in schema "gas-checker" to anon, authenticated, service_role;
grant all on all sequences in schema "gas-checker" to anon, authenticated, service_role;
grant execute on all functions in schema "gas-checker" to anon, authenticated, service_role;
alter default privileges in schema "gas-checker" grant all on tables to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Storage bucket: gas-checker (private)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('gas-checker', 'gas-checker', false)
on conflict (id) do nothing;

drop policy if exists "gas check owner read" on storage.objects;
create policy "gas check owner read" on storage.objects for select
  using (bucket_id = 'gas-checker' and owner = auth.uid());

drop policy if exists "gas check owner write" on storage.objects;
create policy "gas check owner write" on storage.objects for insert
  with check (bucket_id = 'gas-checker' and owner = auth.uid());

drop policy if exists "gas check owner update" on storage.objects;
create policy "gas check owner update" on storage.objects for update
  using (bucket_id = 'gas-checker' and owner = auth.uid());

drop policy if exists "gas check owner delete" on storage.objects;
create policy "gas check owner delete" on storage.objects for delete
  using (bucket_id = 'gas-checker' and owner = auth.uid());

-- ---------------------------------------------------------------------------
-- IMPORTANT: expose the "gas-checker" schema to PostgREST.
-- In Supabase Dashboard > Project Settings > API > Exposed schemas,
-- add: gas-checker
-- (or run the statements below on a self-hosted instance)
-- ---------------------------------------------------------------------------
-- alter role authenticator set pgrst.db_schemas = 'public, gas-checker';
-- notify pgrst, 'reload config';
