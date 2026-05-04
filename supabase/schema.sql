create extension if not exists "pgcrypto";

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  available_money numeric not null default 30000,
  monthly_survival_amount numeric not null default 42000,
  currency text not null default 'MXN',
  emergency_status text not null default 'attention',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null,
  owner_type text not null,
  owner_id uuid,
  current_balance numeric not null default 0,
  credit_limit numeric,
  current_debt numeric not null default 0,
  statement_closing_date date,
  payment_due_date date,
  minimum_payment numeric,
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists incomes (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  amount numeric not null default 0,
  source text not null,
  type text not null,
  person_id uuid references people(id),
  business_id uuid references businesses(id),
  account_id uuid references accounts(id),
  payment_method text,
  attachment_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  name text not null,
  amount numeric not null default 0,
  type text not null,
  category text,
  priority text not null default 'important',
  paid_by_person_id uuid references people(id),
  paid_by_label text,
  account_id uuid references accounts(id),
  business_id uuid references businesses(id),
  due_date date,
  is_recurring boolean not null default false,
  is_business_expense_paid_personally boolean not null default false,
  attachment_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists budget_items (
  id uuid primary key default gen_random_uuid(),
  area text not null,
  category text not null,
  name text not null,
  kind text not null default 'variable',
  planned_amount numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists debts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  creditor text,
  total_amount numeric not null default 0,
  minimum_payment numeric,
  due_date date,
  account_id uuid references accounts(id),
  priority text not null default 'review',
  status text not null default 'pending',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  monthly_amount numeric not null default 0,
  billing_date date,
  type text not null,
  category text,
  priority text not null default 'useful',
  account_id uuid references accounts(id),
  business_id uuid references businesses(id),
  status text not null default 'active',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists upcoming_payments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  due_date date not null,
  amount numeric not null default 0,
  type text not null,
  priority text not null default 'important',
  status text not null default 'pending',
  account_id uuid references accounts(id),
  business_id uuid references businesses(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agenda_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  date date not null,
  time time,
  type text not null,
  area text not null,
  amount numeric not null default 0,
  priority text not null default 'important',
  status text not null default 'pending',
  account_id uuid references accounts(id),
  business_id uuid references businesses(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  total_income numeric not null default 0,
  total_expenses numeric not null default 0,
  balance numeric not null default 0,
  urgent_payments numeric not null default 0,
  cuttable_expenses numeric not null default 0,
  business_draining_money text,
  weekly_sales_goal numeric not null default 0,
  external_income_needed numeric not null default 0,
  recommended_actions text,
  decision_taken text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into settings (available_money, monthly_survival_amount, currency, emergency_status)
select 30000, 42000, 'MXN', 'attention'
where not exists (select 1 from settings);

insert into people (name, role)
select 'Maria', 'owner'
where not exists (select 1 from people where name = 'Maria');

insert into people (name, role)
select 'Gina', 'owner'
where not exists (select 1 from people where name = 'Gina');

insert into businesses (name, status)
select 'Botica Spa', 'attention'
where not exists (select 1 from businesses where name = 'Botica Spa');

insert into businesses (name, status)
select 'Walkme', 'attention'
where not exists (select 1 from businesses where name = 'Walkme');

alter table settings enable row level security;
alter table people enable row level security;
alter table businesses enable row level security;
alter table accounts enable row level security;
alter table incomes enable row level security;
alter table expenses enable row level security;
alter table budget_items enable row level security;
alter table debts enable row level security;
alter table subscriptions enable row level security;
alter table upcoming_payments enable row level security;
alter table agenda_items enable row level security;
alter table weekly_reviews enable row level security;

create policy "Allow public MVP read settings" on settings for select using (true);
create policy "Allow public MVP write settings" on settings for all using (true) with check (true);
create policy "Allow public MVP read people" on people for select using (true);
create policy "Allow public MVP write people" on people for all using (true) with check (true);
create policy "Allow public MVP read businesses" on businesses for select using (true);
create policy "Allow public MVP write businesses" on businesses for all using (true) with check (true);
create policy "Allow public MVP read accounts" on accounts for select using (true);
create policy "Allow public MVP write accounts" on accounts for all using (true) with check (true);
create policy "Allow public MVP read incomes" on incomes for select using (true);
create policy "Allow public MVP write incomes" on incomes for all using (true) with check (true);
create policy "Allow public MVP read expenses" on expenses for select using (true);
create policy "Allow public MVP write expenses" on expenses for all using (true) with check (true);
create policy "Allow public MVP read budget items" on budget_items for select using (true);
create policy "Allow public MVP write budget items" on budget_items for all using (true) with check (true);
create policy "Allow public MVP read debts" on debts for select using (true);
create policy "Allow public MVP write debts" on debts for all using (true) with check (true);
create policy "Allow public MVP read subscriptions" on subscriptions for select using (true);
create policy "Allow public MVP write subscriptions" on subscriptions for all using (true) with check (true);
create policy "Allow public MVP read upcoming payments" on upcoming_payments for select using (true);
create policy "Allow public MVP write upcoming payments" on upcoming_payments for all using (true) with check (true);
create policy "Allow public MVP read agenda items" on agenda_items for select using (true);
create policy "Allow public MVP write agenda items" on agenda_items for all using (true) with check (true);
create policy "Allow public MVP read weekly reviews" on weekly_reviews for select using (true);
create policy "Allow public MVP write weekly reviews" on weekly_reviews for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

update storage.buckets
set public = true
where id = 'receipts';

create policy "Allow public MVP read receipts" on storage.objects
for select using (bucket_id = 'receipts');

create policy "Allow public MVP upload receipts" on storage.objects
for insert with check (bucket_id = 'receipts');

create policy "Allow public MVP update receipts" on storage.objects
for update using (bucket_id = 'receipts') with check (bucket_id = 'receipts');

create policy "Allow public MVP delete receipts" on storage.objects
for delete using (bucket_id = 'receipts');
