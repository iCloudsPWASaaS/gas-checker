-- Gas Checker - Jobs, Job Addresses, Tools and Notifications
-- Run after 0001_init.sql and 0002_admin.sql.
-- Schema: "gas-checker"

-- ---------------------------------------------------------------------------
-- Settings additions
-- ---------------------------------------------------------------------------
alter table "gas-checker".settings
  add column if not exists oil_registration text,
  add column if not exists mcs_registration text;

-- ---------------------------------------------------------------------------
-- Job addresses (properties)
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  contact_id uuid references "gas-checker".contacts(id) on delete set null,
  name text not null,
  address_line1 text,
  address_line2 text,
  address_line3 text,
  postcode text,
  access_notes text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_user_idx on "gas-checker".properties(user_id, name);
create index if not exists properties_postcode_idx on "gas-checker".properties(user_id, postcode);

-- ---------------------------------------------------------------------------
-- Jobs
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid references "gas-checker".properties(id) on delete set null,
  contact_id uuid references "gas-checker".contacts(id) on delete set null,
  reference text,
  title text not null,
  job_type text not null default 'gas_safety',
  status text not null default 'scheduled'
    check (status in ('scheduled','in_progress','completed','cancelled')),
  priority text not null default 'normal'
    check (priority in ('low','normal','urgent')),
  scheduled_at timestamptz,
  completed_at timestamptz,
  engineer text,
  description text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_user_status_idx on "gas-checker".jobs(user_id, status);
create index if not exists jobs_user_schedule_idx on "gas-checker".jobs(user_id, scheduled_at);
create index if not exists jobs_property_idx on "gas-checker".jobs(property_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create table if not exists "gas-checker".notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text,
  kind text not null default 'system',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_idx on "gas-checker".notifications(user_id, created_at desc);
create index if not exists notifications_unread_idx on "gas-checker".notifications(user_id, read_at);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['properties','jobs']
  loop
    execute format('drop trigger if exists set_updated_at on "gas-checker".%I', t);
    execute format('create trigger set_updated_at before update on "gas-checker".%I for each row execute function "gas-checker".set_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table "gas-checker".properties enable row level security;
alter table "gas-checker".jobs enable row level security;
alter table "gas-checker".notifications enable row level security;

do $$
declare t text;
begin
  foreach t in array array['properties','jobs','notifications']
  loop
    execute format('drop policy if exists "owner select" on "gas-checker".%I', t);
    execute format('drop policy if exists "owner insert" on "gas-checker".%I', t);
    execute format('drop policy if exists "owner update" on "gas-checker".%I', t);
    execute format('drop policy if exists "owner delete" on "gas-checker".%I', t);

    execute format('create policy "owner select" on "gas-checker".%I for select using (user_id = (select auth.uid()))', t);
    execute format('create policy "owner insert" on "gas-checker".%I for insert with check (user_id = (select auth.uid()))', t);
    execute format('create policy "owner update" on "gas-checker".%I for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create policy "owner delete" on "gas-checker".%I for delete using (user_id = (select auth.uid()))', t);
  end loop;
end $$;

grant all on all tables in schema "gas-checker" to anon, authenticated, service_role;
grant all on all sequences in schema "gas-checker" to anon, authenticated, service_role;
grant execute on all functions in schema "gas-checker" to anon, authenticated, service_role;
