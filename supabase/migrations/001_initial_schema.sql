-- ============================================================
-- OAR Rescue — Initial Schema
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- OWNERS
-- ─────────────────────────────────────────────
create table if not exists owners (
  id               uuid primary key default gen_random_uuid(),
  full_name        text,
  phone_primary    text,
  email            text,
  phone_secondary  text,
  street_address   text,
  city             text,
  province         text default 'BC',
  postal_code      text,
  contact_type     text[] default '{}',
  notes            text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- ─────────────────────────────────────────────
-- PETS
-- ─────────────────────────────────────────────
create table if not exists pets (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid references owners(id) on delete set null,
  name               text not null,
  species            text not null check (species in ('dog','cat','other')),
  species_other      text,
  breed              text,
  age_years          integer,
  age_months         integer,
  sex                text check (sex in ('male','female','unknown')),
  colour_markings    text,
  weight_lbs         numeric(5,1),
  microchip_number   text,
  spayed_neutered    boolean,
  intake_type        text check (intake_type in ('surrender','stray','found','transfer')),
  current_status     text not null default 'intake'
                       check (current_status in ('intake','vet_check','available','foster','adopted','deceased')),
  medical_notes      text,
  behavioural_notes  text,
  photo_urls         text[] default '{}',
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

-- ─────────────────────────────────────────────
-- VACCINATIONS
-- ─────────────────────────────────────────────
create table if not exists vaccinations (
  id          uuid primary key default gen_random_uuid(),
  pet_id      uuid not null references pets(id) on delete cascade,
  type        text not null check (type in ('rabies','distemper','bordetella','other')),
  date_given  date,
  notes       text
);

-- ─────────────────────────────────────────────
-- STATUS LOG
-- ─────────────────────────────────────────────
create table if not exists status_log (
  id          uuid primary key default gen_random_uuid(),
  pet_id      uuid not null references pets(id) on delete cascade,
  status      text not null check (status in ('intake','vet_check','available','foster','adopted','deceased')),
  changed_at  timestamptz default now(),
  changed_by  uuid references auth.users(id) on delete set null,
  notes       text
);

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGER
-- ─────────────────────────────────────────────
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger owners_updated_at
  before update on owners
  for each row execute function handle_updated_at();

create trigger pets_updated_at
  before update on pets
  for each row execute function handle_updated_at();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
-- All authenticated users can read/write all records (small volunteer team)

alter table owners enable row level security;
alter table pets enable row level security;
alter table vaccinations enable row level security;
alter table status_log enable row level security;

-- Owners table
create policy "Authenticated users can view owners"
  on owners for select
  to authenticated
  using (true);

create policy "Authenticated users can insert owners"
  on owners for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update owners"
  on owners for update
  to authenticated
  using (true);

create policy "Authenticated users can delete owners"
  on owners for delete
  to authenticated
  using (true);

-- Pets table
create policy "Authenticated users can view pets"
  on pets for select
  to authenticated
  using (true);

create policy "Authenticated users can insert pets"
  on pets for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update pets"
  on pets for update
  to authenticated
  using (true);

create policy "Authenticated users can delete pets"
  on pets for delete
  to authenticated
  using (true);

-- Vaccinations table
create policy "Authenticated users can view vaccinations"
  on vaccinations for select
  to authenticated
  using (true);

create policy "Authenticated users can insert vaccinations"
  on vaccinations for insert
  to authenticated
  with check (true);

create policy "Authenticated users can update vaccinations"
  on vaccinations for update
  to authenticated
  using (true);

create policy "Authenticated users can delete vaccinations"
  on vaccinations for delete
  to authenticated
  using (true);

-- Status log table
create policy "Authenticated users can view status_log"
  on status_log for select
  to authenticated
  using (true);

create policy "Authenticated users can insert status_log"
  on status_log for insert
  to authenticated
  with check (true);

-- ─────────────────────────────────────────────
-- STORAGE BUCKET
-- ─────────────────────────────────────────────
-- Run this in Supabase Dashboard > Storage, or via the API:
-- insert into storage.buckets (id, name, public) values ('pet-photos', 'pet-photos', true);

-- Storage RLS policies (if using SQL):
-- create policy "Authenticated users can upload photos"
--   on storage.objects for insert
--   to authenticated
--   with check (bucket_id = 'pet-photos');

-- create policy "Anyone can view photos"
--   on storage.objects for select
--   using (bucket_id = 'pet-photos');

-- create policy "Authenticated users can delete photos"
--   on storage.objects for delete
--   to authenticated
--   using (bucket_id = 'pet-photos');
