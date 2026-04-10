-- ============================================================
-- TenderTrack — Supabase Database Schema
-- Run this in the Supabase SQL Editor (supabase.com/dashboard)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text,
  full_name   text,
  role        text not null default 'viewer',  -- 'admin' | 'manager' | 'viewer'
  department  text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ============================================================
-- TENDERS
-- ============================================================
create table if not exists tenders (
  id               text primary key default ('t-' || gen_random_uuid()::text),
  dept             text not null default 'AIMS-Projects',
  tender_name      text not null,
  tender_number    text,
  tender_type      text,
  status           text not null default 'Pending',
  priority         text not null default 'Medium',
  -- Dates
  issue_date       date,
  closing_date     date,
  award_date       date,
  follow_up_date   date,
  -- People
  client           text,
  contact_name     text,
  contact_email    text,
  contact_phone    text,
  account_manager  text,
  opp_owner        text,
  vendor           text,
  -- Financials
  our_bid          numeric(15,3),
  price            numeric(15,3),
  currency         text default 'KWD',
  -- Pre-tender
  pre_tender_meeting  text,
  pre_tender_attended text,
  meeting_notes       text,
  -- Notes
  solution_brief   text,
  remarks          text,
  loss_reason      text,
  loss_note        text,
  -- Arrays stored as JSONB
  tags             jsonb default '[]',
  competitor_bids  jsonb default '[]',
  comments         jsonb default '[]',
  docs             jsonb default '[]',
  status_history   jsonb default '[]',
  -- Bid Bond stored as JSONB
  bid_bond         jsonb default '{}',
  -- Meta
  fiscal_year      text,
  created_by       uuid references profiles(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ============================================================
-- DEALS (Sales & Payment Tracker)
-- ============================================================
create table if not exists deals (
  id               text primary key default ('d-' || gen_random_uuid()::text),
  deal_name        text not null,
  client           text not null,
  deal_type        text not null default 'Direct Contract',
  status           text not null default 'Prospecting',
  priority         text not null default 'Medium',
  account_manager  text,
  opp_owner        text,
  -- Financials
  value            numeric(15,3),
  currency         text default 'KWD',
  -- Dates
  start_date       date,
  end_date         date,
  renewal_date     date,
  -- Contract
  contract_number  text,
  description      text,
  deliverables     text,
  notes            text,
  -- Contact
  contact_name     text,
  contact_email    text,
  contact_phone    text,
  -- Meta
  department       text default 'AIMS-Projects',
  tags             jsonb default '[]',
  history          jsonb default '[]',
  created_by       uuid references profiles(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ============================================================
-- INVOICES
-- ============================================================
create table if not exists invoices (
  id              text primary key default ('inv-' || gen_random_uuid()::text),
  deal_id         text not null references deals(id) on delete cascade,
  invoice_number  text,
  issue_date      date,
  due_date        date,
  amount          numeric(15,3) not null,
  currency        text default 'KWD',
  status          text not null default 'Draft',
  description     text,
  paid_date       date,
  paid_amount     numeric(15,3),
  notes           text,
  created_by      uuid references profiles(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================
-- ACTIVITY LOG
-- ============================================================
create table if not exists activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references profiles(id),
  icon        text,
  message     text not null,
  entity_type text,   -- 'tender' | 'deal' | 'invoice'
  entity_id   text,
  created_at  timestamptz default now()
);

-- ============================================================
-- USER SETTINGS (per-user config: KPI targets, sidebar state, etc.)
-- ============================================================
create table if not exists user_settings (
  user_id     uuid primary key references profiles(id) on delete cascade,
  kpi_targets jsonb default '{"winRate":50,"totalWon":10,"pipelineValue":500000,"activeCount":20}',
  ui_prefs    jsonb default '{"sidebarCollapsed":false,"darkMode":false,"defaultDept":"AIMS-Projects"}',
  updated_at  timestamptz default now()
);

-- ============================================================
-- APP SETTINGS (org-wide: custom lists, tender types, etc.)
-- ============================================================
create table if not exists app_settings (
  key         text primary key,
  value       jsonb not null,
  updated_by  uuid references profiles(id),
  updated_at  timestamptz default now()
);

-- Insert default app settings
insert into app_settings (key, value) values
  ('tender_types',   '["Tender (مناقصة)","Practice (ممارسة)","RFQ (طلب شراء)","Bidding (مزايدة)","Quotation (استدراج)","Direct (مباشر)","Framework","International"]'),
  ('departments',    '["AIMS-Projects","AIMS-Consultations","AIMS-Sales","Plexus"]'),
  ('currencies',     '["KWD","USD","EUR","GBP","SAR","AED"]'),
  ('acct_managers',  '["Tarek","Sona","Sakher","Aws","Mahmoud"]'),
  ('opp_owners',     '["Shady","Aaseim","Tamer","Nadeem","Rawan","Muath","Sonill"]')
on conflict (key) do nothing;

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_tenders_status       on tenders(status);
create index if not exists idx_tenders_dept         on tenders(dept);
create index if not exists idx_tenders_closing_date on tenders(closing_date);
create index if not exists idx_tenders_created_at   on tenders(created_at desc);
create index if not exists idx_tenders_created_by   on tenders(created_by);
create index if not exists idx_deals_status         on deals(status);
create index if not exists idx_deals_client         on deals(client);
create index if not exists idx_invoices_deal_id     on invoices(deal_id);
create index if not exists idx_invoices_status      on invoices(status);
create index if not exists idx_invoices_due_date    on invoices(due_date);
create index if not exists idx_activity_log_user    on activity_log(user_id, created_at desc);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table profiles     enable row level security;
alter table tenders      enable row level security;
alter table deals        enable row level security;
alter table invoices     enable row level security;
alter table activity_log enable row level security;
alter table user_settings enable row level security;
alter table app_settings  enable row level security;

-- Profiles: users can read all, update their own
create policy "profiles_read_all"   on profiles for select using (true);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Tenders: all authenticated users can read/write
create policy "tenders_read"   on tenders for select using (auth.role() = 'authenticated');
create policy "tenders_insert" on tenders for insert with check (auth.role() = 'authenticated');
create policy "tenders_update" on tenders for update using (auth.role() = 'authenticated');
create policy "tenders_delete" on tenders for delete using (
  auth.uid() = created_by
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Deals
create policy "deals_read"   on deals for select using (auth.role() = 'authenticated');
create policy "deals_insert" on deals for insert with check (auth.role() = 'authenticated');
create policy "deals_update" on deals for update using (auth.role() = 'authenticated');
create policy "deals_delete" on deals for delete using (
  auth.uid() = created_by
  or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Invoices
create policy "invoices_read"   on invoices for select using (auth.role() = 'authenticated');
create policy "invoices_insert" on invoices for insert with check (auth.role() = 'authenticated');
create policy "invoices_update" on invoices for update using (auth.role() = 'authenticated');
create policy "invoices_delete" on invoices for delete using (auth.role() = 'authenticated');

-- Activity log
create policy "activity_read"   on activity_log for select using (auth.role() = 'authenticated');
create policy "activity_insert" on activity_log for insert with check (auth.role() = 'authenticated');

-- User settings: own row only
create policy "user_settings_own" on user_settings for all using (auth.uid() = user_id);

-- App settings: all read, admin write
create policy "app_settings_read"  on app_settings for select using (auth.role() = 'authenticated');
create policy "app_settings_write" on app_settings for all using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;

  insert into user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tenders_updated_at  before update on tenders  for each row execute procedure update_updated_at();
create trigger deals_updated_at    before update on deals    for each row execute procedure update_updated_at();
create trigger invoices_updated_at before update on invoices for each row execute procedure update_updated_at();

-- ============================================================
-- REALTIME (enable for live collaboration)
-- ============================================================
alter publication supabase_realtime add table tenders;
alter publication supabase_realtime add table deals;
alter publication supabase_realtime add table invoices;
alter publication supabase_realtime add table activity_log;
