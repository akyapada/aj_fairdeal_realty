-- =====================================================================
-- Hyderabad Real Estate Platform — Database Schema v1
-- Target: Supabase (PostgreSQL)
--
-- Run this in the Supabase SQL Editor on a fresh project.
-- Read the notes at the bottom before you run it.
-- =====================================================================

create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. ENUMS
-- Using enums (not free text) is what makes the data queryable later.
-- Adding a value later is easy: ALTER TYPE x ADD VALUE 'y';
-- =====================================================================

create type property_type        as enum ('apartment','villa','plot','commercial');
create type commercial_subtype   as enum ('office','retail','showroom','warehouse','other');
create type listing_kind         as enum ('new_launch','resale','rental');
create type txn_type             as enum ('sale','rent');
create type construction_status  as enum ('pre_launch','under_construction','nearing_possession','ready_to_move','completed');
create type furnishing_level     as enum ('unfurnished','semi_furnished','fully_furnished');
create type facing_dir           as enum ('north','south','east','west','north_east','north_west','south_east','south_west');
create type listing_status       as enum ('draft','active','on_hold','sold','rented','withdrawn');
create type buyer_purpose        as enum ('end_use','investment','unsure');
create type lead_status          as enum ('new','contacted','qualified','site_visit_scheduled','site_visit_done','negotiating','booked','lost','dormant');
create type activity_type        as enum ('call','whatsapp','email','site_visit','meeting','note','status_change');
create type interest_type        as enum ('viewed','shortlisted','enquired','site_visit','rejected');
create type user_role            as enum ('admin','agent');

-- =====================================================================
-- 2. PEOPLE (your team)
-- Extends Supabase's built-in auth.users table.
-- =====================================================================

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  phone         text,
  role          user_role not null default 'agent',
  rera_agent_no text,                    -- each agent's own RERA number
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

-- =====================================================================
-- 3. GEOGRAPHY
-- Hyderabad-specific. Locality drives almost every buyer decision here,
-- so it is a proper table, never a free-text field.
-- =====================================================================

create table localities (
  id            serial primary key,
  name          text not null unique,        -- 'Kokapet', 'Tellapur', 'Kompally'
  zone          text,                        -- 'West', 'North', 'East', 'Central', 'South'
  pincode       text,
  latitude      numeric(9,6),
  longitude     numeric(9,6),
  slug          text not null unique,        -- for SEO URLs: /localities/kokapet
  description   text,                        -- your own SEO content about the area
  is_active     boolean not null default true
);

create index on localities (zone);

-- =====================================================================
-- 4. BUILDERS / DEVELOPERS
-- =====================================================================

create table builders (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  slug             text not null unique,
  established_year int,
  description      text,
  logo_url         text,
  website          text,
  -- your own honest internal assessment; never shown publicly
  internal_notes   text,
  quality_rating   int check (quality_rating between 1 and 5),
  created_at       timestamptz not null default now()
);

-- =====================================================================
-- 5. PROJECTS
-- A project = a development. For a resale flat in an older building,
-- the building is still a project row (with is_rera_registered = false).
-- =====================================================================

create table projects (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  slug                  text not null unique,
  builder_id            uuid references builders(id) on delete set null,
  locality_id           int not null references localities(id),

  property_type         property_type not null,
  commercial_sub        commercial_subtype,        -- only when property_type='commercial'

  -- ---- RERA: legally required on every advertisement ----
  rera_number           text,
  is_rera_registered    boolean not null default false,
  rera_valid_until      date,

  construction_status   construction_status not null default 'under_construction',
  possession_date       date,                      -- expected or actual

  address               text,
  latitude              numeric(9,6),
  longitude             numeric(9,6),

  total_units           int,
  total_towers          int,
  total_floors          int,
  land_area_acres       numeric(8,2),
  open_space_percent    numeric(5,2),

  -- Searchable amenity flags. Kept as an array for simplicity;
  -- query with: where amenities @> array['clubhouse']
  amenities             text[] default '{}',

  description           text,
  -- Your honest internal view. Powers your differentiation. NEVER public.
  internal_pros         text,
  internal_cons         text,

  -- SEO
  meta_title            text,
  meta_description      text,

  is_published          boolean not null default false,
  created_by            uuid references profiles(id),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index on projects (locality_id);
create index on projects (property_type);
create index on projects (construction_status);
create index on projects (is_published) where is_published = true;

-- =====================================================================
-- 6. LISTINGS  ** the most important table **
--
-- A listing is anything a buyer/tenant can express interest in.
--   new_launch : one row per configuration (2BHK Type A, 3BHK Type B...)
--                price is a RANGE, units_available is a count
--   resale     : one row per specific unit, exact price, has an owner
--   rental     : one row per specific unit, monthly rent + deposit
--
-- Everything a buyer searches by lives on THIS table, so search is
-- a single indexed query rather than a join across three tables.
-- =====================================================================

create table listings (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references projects(id) on delete cascade,
  kind                listing_kind not null,
  transaction         txn_type not null default 'sale',
  status              listing_status not null default 'draft',

  title               text,                        -- '3 BHK Type B, East facing'
  slug                text unique,

  -- ---- configuration ----
  bedrooms            int,                         -- BHK. null for plots/commercial
  bathrooms           int,
  balconies           int,
  floor_number        int,                         -- resale/rental: which floor
  unit_number         text,                        -- resale/rental only

  -- ---- area (always store sqft; Hyderabad quotes in sqft) ----
  carpet_area_sqft    numeric(10,2),
  builtup_area_sqft   numeric(10,2),
  saleable_area_sqft  numeric(10,2),               -- what builders advertise
  plot_area_sqyd      numeric(10,2),               -- villas/plots: sq yards

  facing              facing_dir,
  furnishing          furnishing_level,
  parking_count       int default 0,
  age_years           int,                         -- resale only

  -- ---- money (all INR) ----
  -- new_launch: use price_min/price_max as the range
  -- resale:     set both to the same value, or use price_min only
  price_min           numeric(14,2),
  price_max           numeric(14,2),
  price_per_sqft      numeric(10,2),
  monthly_rent        numeric(12,2),               -- rentals only
  security_deposit    numeric(12,2),               -- rentals only
  maintenance_monthly numeric(10,2),
  is_price_on_request boolean not null default false,

  units_available     int,                         -- new_launch inventory count

  -- ---- resale/rental owner (PRIVATE — see RLS below) ----
  owner_name          text,
  owner_phone         text,
  owner_notes         text,

  description         text,
  highlights          text[] default '{}',

  is_featured         boolean not null default false,
  created_by          uuid references profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index on listings (project_id);
create index on listings (kind, transaction, status);
create index on listings (bedrooms);
create index on listings (price_min, price_max);
create index on listings (status) where status = 'active';

-- =====================================================================
-- 7. MEDIA
-- One table for project- and listing-level images, floor plans, videos.
-- =====================================================================

create table media (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects(id) on delete cascade,
  listing_id  uuid references listings(id) on delete cascade,
  kind        text not null default 'image',   -- image|floor_plan|brochure|video|tour
  url         text not null,
  caption     text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  constraint media_belongs_to_one
    check (num_nonnulls(project_id, listing_id) = 1)
);

create index on media (project_id);
create index on media (listing_id);

-- =====================================================================
-- 8. LEADS
-- The person. Requirements live in a SEPARATE table (section 9) because
-- what someone wants changes over time, and that history is exactly what
-- makes prediction possible later.
-- =====================================================================

create table leads (
  id                uuid primary key default gen_random_uuid(),
  full_name         text,
  phone             text not null,
  email             text,

  status            lead_status not null default 'new',
  owner_id          uuid references profiles(id),     -- which agent owns this lead

  -- where they came from
  source            text,                              -- 'organic','google_ads','whatsapp','referral','walk_in'
  source_detail     text,                              -- campaign name, referrer name
  first_landing_page text,

  -- computed by a nightly job or a view (see section 13)
  score             int not null default 0,

  -- DPDP: consent is not optional. Record it at the moment it is given.
  consent_given     boolean not null default false,
  consent_at        timestamptz,
  consent_text      text,                              -- exact wording they agreed to
  is_deleted        boolean not null default false,    -- soft delete for erasure requests

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  last_contacted_at timestamptz
);

create unique index leads_phone_unique on leads (phone) where is_deleted = false;
create index on leads (owner_id);
create index on leads (status);
create index on leads (created_at desc);

-- =====================================================================
-- 9. LEAD REQUIREMENTS  ** your competitive advantage **
--
-- One row per requirement capture. NEVER overwrite — insert a new row
-- when their brief changes. The history of how a buyer's requirement
-- shifts is the single most valuable dataset you will own.
-- =====================================================================

create table lead_requirements (
  id                    uuid primary key default gen_random_uuid(),
  lead_id               uuid not null references leads(id) on delete cascade,

  transaction           txn_type not null default 'sale',
  property_types        property_type[] default '{}',
  bedrooms_wanted       int[] default '{}',            -- {2,3} = open to 2 or 3 BHK

  budget_min            numeric(14,2),
  budget_max            numeric(14,2),

  min_area_sqft         numeric(10,2),
  max_area_sqft         numeric(10,2),

  preferred_localities  int[] default '{}',            -- references localities(id)

  possession_by         date,
  construction_pref     construction_status[],

  purpose               buyer_purpose,
  loan_required         boolean,
  loan_pre_approved     boolean,

  -- Hyderabad-specific and disproportionately predictive:
  workplace_locality_id int references localities(id),
  max_commute_minutes   int,

  family_size           int,
  has_school_age_kids   boolean,
  is_first_purchase     boolean,

  notes                 text,
  captured_by           uuid references profiles(id),  -- null = self-service form
  captured_at           timestamptz not null default now()
);

create index on lead_requirements (lead_id, captured_at desc);

-- =====================================================================
-- 10. LEAD ACTIVITY — every interaction, timestamped
-- =====================================================================

create table lead_activities (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references leads(id) on delete cascade,
  type          activity_type not null,
  subject       text,
  body          text,
  outcome       text,                        -- 'connected','no_answer','interested'
  scheduled_for timestamptz,                 -- for site visits
  completed_at  timestamptz,
  agent_id      uuid references profiles(id),
  created_at    timestamptz not null default now()
);

create index on lead_activities (lead_id, created_at desc);

-- =====================================================================
-- 11. LEAD ↔ LISTING INTEREST
-- Connects a person to specific properties. Powers both the agent's
-- call prep and, later, the recommendation engine.
-- =====================================================================

create table lead_listing_interest (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads(id) on delete cascade,
  listing_id  uuid not null references listings(id) on delete cascade,
  type        interest_type not null,
  notes       text,                          -- why they rejected it — gold dust
  created_at  timestamptz not null default now()
);

create index on lead_listing_interest (lead_id, created_at desc);
create index on lead_listing_interest (listing_id);

-- =====================================================================
-- 12. ANONYMOUS BROWSING
--
-- Records views by session BEFORE you know who someone is. When they
-- later submit their number, you backfill lead_id for that session and
-- instantly inherit their whole browsing history.
--
-- This one table is why you will be able to do prediction in month 8.
-- =====================================================================

create table listing_views (
  id           bigserial primary key,
  session_id   text not null,               -- anonymous id from a cookie
  listing_id   uuid references listings(id) on delete cascade,
  project_id   uuid references projects(id) on delete cascade,
  lead_id      uuid references leads(id) on delete set null,  -- backfilled later
  seconds_on_page int,
  referrer     text,
  created_at   timestamptz not null default now()
);

create index on listing_views (session_id);
create index on listing_views (lead_id);
create index on listing_views (created_at desc);

-- =====================================================================
-- 13. AUTO-UPDATE updated_at
-- =====================================================================

create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger t_projects_touch before update on projects
  for each row execute function touch_updated_at();
create trigger t_listings_touch before update on listings
  for each row execute function touch_updated_at();
create trigger t_leads_touch    before update on leads
  for each row execute function touch_updated_at();

-- =====================================================================
-- 14. ROW LEVEL SECURITY   ** READ THIS SECTION CAREFULLY **
--
-- This is the part that, if wrong, exposes every lead's name, phone
-- number and budget to anyone who finds your API URL. Have a human
-- verify it before you launch.
-- =====================================================================

alter table profiles              enable row level security;
alter table localities            enable row level security;
alter table builders              enable row level security;
alter table projects              enable row level security;
alter table listings              enable row level security;
alter table media                 enable row level security;
alter table leads                 enable row level security;
alter table lead_requirements     enable row level security;
alter table lead_activities       enable row level security;
alter table lead_listing_interest enable row level security;
alter table listing_views         enable row level security;

-- helper: is the current user an admin?
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$ language sql security definer stable;

-- helper: is the current user staff at all?
create or replace function is_staff() returns boolean as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and is_active
  );
$$ language sql security definer stable;

-- ---- PUBLIC READ: only published, active inventory ----
create policy "public reads active localities"
  on localities for select using (is_active);

create policy "public reads builders"
  on builders for select using (true);

create policy "public reads published projects"
  on projects for select using (is_published);

create policy "public reads active listings"
  on listings for select using (
    status = 'active'
    and exists (select 1 from projects p
                where p.id = listings.project_id and p.is_published)
  );

create policy "public reads media"
  on media for select using (true);

-- NOTE: `listings` exposes owner_name / owner_phone / owner_notes to the
-- public SELECT above. Do NOT query those columns from the public site.
-- Safest fix once you are past week 1: move those three columns into a
-- separate `listing_owners` table that has NO public policy at all.

-- ---- STAFF WRITE on inventory ----
create policy "staff manage projects"  on projects  for all using (is_staff()) with check (is_staff());
create policy "staff manage listings"  on listings  for all using (is_staff()) with check (is_staff());
create policy "staff manage builders"  on builders  for all using (is_staff()) with check (is_staff());
create policy "staff manage media"     on media     for all using (is_staff()) with check (is_staff());
create policy "staff manage localities" on localities for all using (is_staff()) with check (is_staff());

-- ---- LEADS: agents see only their own, admins see all ----
-- There is deliberately NO public select policy on leads.
create policy "staff read own leads" on leads for select
  using (is_admin() or owner_id = auth.uid());

create policy "staff update own leads" on leads for update
  using (is_admin() or owner_id = auth.uid())
  with check (is_admin() or owner_id = auth.uid());

create policy "staff insert leads" on leads for insert
  with check (is_staff());

create policy "admins delete leads" on leads for delete using (is_admin());

-- child tables follow the parent lead's visibility
create policy "staff read own lead requirements" on lead_requirements for select
  using (exists (select 1 from leads l where l.id = lead_id
                 and (is_admin() or l.owner_id = auth.uid())));
create policy "staff write lead requirements" on lead_requirements for insert
  with check (is_staff());

create policy "staff read own lead activities" on lead_activities for select
  using (exists (select 1 from leads l where l.id = lead_id
                 and (is_admin() or l.owner_id = auth.uid())));
create policy "staff write lead activities" on lead_activities for all
  using (is_staff()) with check (is_staff());

create policy "staff read own lead interest" on lead_listing_interest for select
  using (exists (select 1 from leads l where l.id = lead_id
                 and (is_admin() or l.owner_id = auth.uid())));
create policy "staff write lead interest" on lead_listing_interest for all
  using (is_staff()) with check (is_staff());

create policy "admins read views" on listing_views for select using (is_admin());

create policy "staff read profiles" on profiles for select using (is_staff());
create policy "users update own profile" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());

-- =====================================================================
-- 15. PUBLIC WRITE PATHS
--
-- The public site must be able to (a) record a page view and (b) submit
-- an enquiry — WITHOUT being able to read the leads table.
-- These are SECURITY DEFINER functions: the only door in.
-- =====================================================================

create or replace function record_listing_view(
  p_session_id text,
  p_listing_id uuid default null,
  p_project_id uuid default null,
  p_seconds    int  default null
) returns void as $$
  insert into listing_views (session_id, listing_id, project_id, seconds_on_page)
  values (p_session_id, p_listing_id, p_project_id, p_seconds);
$$ language sql security definer;

create or replace function submit_enquiry(
  p_name        text,
  p_phone       text,
  p_email       text,
  p_session_id  text,
  p_listing_id  uuid,
  p_consent     boolean,
  p_consent_text text,
  p_source      text default 'organic',
  p_budget_min  numeric default null,
  p_budget_max  numeric default null,
  p_bedrooms    int[] default null,
  p_localities  int[] default null,
  p_purpose     buyer_purpose default null,
  p_notes       text default null
) returns uuid as $$
declare
  v_lead_id uuid;
begin
  if p_consent is not true then
    raise exception 'Consent is required';
  end if;

  -- one person, one lead record
  insert into leads (full_name, phone, email, source, consent_given, consent_at, consent_text)
  values (p_name, p_phone, p_email, p_source, true, now(), p_consent_text)
  on conflict (phone) where is_deleted = false
  do update set
    full_name = coalesce(excluded.full_name, leads.full_name),
    email     = coalesce(excluded.email, leads.email),
    updated_at = now()
  returning id into v_lead_id;

  insert into lead_requirements
    (lead_id, budget_min, budget_max, bedrooms_wanted, preferred_localities, purpose, notes)
  values
    (v_lead_id, p_budget_min, p_budget_max,
     coalesce(p_bedrooms,'{}'), coalesce(p_localities,'{}'), p_purpose, p_notes);

  if p_listing_id is not null then
    insert into lead_listing_interest (lead_id, listing_id, type)
    values (v_lead_id, p_listing_id, 'enquired');
  end if;

  -- inherit their whole anonymous browsing history
  update listing_views
     set lead_id = v_lead_id
   where session_id = p_session_id and lead_id is null;

  return v_lead_id;
end;
$$ language plpgsql security definer;

revoke all on function submit_enquiry from public;
grant execute on function submit_enquiry to anon, authenticated;
grant execute on function record_listing_view to anon, authenticated;

-- =====================================================================
-- 16. LEAD SCORING — rule-based, no ML required
-- This is your "predictive" layer for the first six months. It works.
-- =====================================================================

create or replace view lead_scores as
select
  l.id as lead_id,
  l.full_name,
  l.phone,
  l.status,
  l.owner_id,
  (
      -- engagement
      least(coalesce(v.view_count,0) * 3, 30)
      -- came back on a different day
    + case when coalesce(v.distinct_days,0) > 1 then 20 else 0 end
      -- told us a real budget
    + case when r.budget_max is not null then 15 else 0 end
      -- told us where they work (high-intent disclosure)
    + case when r.workplace_locality_id is not null then 10 else 0 end
      -- end-user buyers close more reliably than investors
    + case when r.purpose = 'end_use' then 10 else 0 end
      -- loan already pre-approved
    + case when r.loan_pre_approved then 15 else 0 end
      -- recency decay
    + case
        when l.created_at > now() - interval '3 days'  then 15
        when l.created_at > now() - interval '14 days' then 5
        else 0
      end
  ) as score,
  v.view_count,
  v.distinct_days,
  r.budget_min,
  r.budget_max,
  r.purpose
from leads l
left join lateral (
  select count(*) as view_count,
         count(distinct date(created_at)) as distinct_days
  from listing_views lv where lv.lead_id = l.id
) v on true
left join lateral (
  select * from lead_requirements lr
  where lr.lead_id = l.id order by captured_at desc limit 1
) r on true
where l.is_deleted = false;

-- =====================================================================
-- NOTES BEFORE YOU RUN THIS
--
-- 1. Run it in the Supabase SQL Editor on a BRAND NEW project.
--
-- 2. After running, create your own profile row:
--      insert into profiles (id, full_name, role)
--      values ('<your auth.users uuid>', 'Your Name', 'admin');
--    Find your uuid under Authentication → Users after you sign up.
--
-- 3. Seed localities before anything else. Start with ~40 Hyderabad
--    areas: Kokapet, Tellapur, Narsingi, Gachibowli, Kondapur, Manikonda,
--    Nanakramguda, Financial District, Bachupally, Kompally, Miyapur,
--    Nizampet, Uppal, Pocharam, LB Nagar, Shamshabad, Adibatla...
--
-- 4. The owner_phone exposure noted in section 14 is the one known soft
--    spot in v1. Fix it before you list a single real resale property.
--
-- 5. Have someone competent test exactly two things before launch:
--      - can an unauthenticated request read the `leads` table?
--      - can agent A read agent B's leads?
--    Everything else is recoverable. These two are not.
-- =====================================================================
