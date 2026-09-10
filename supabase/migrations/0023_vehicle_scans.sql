-- Smart vehicle system: a background job queue, the scan pipeline that turns
-- a phone walk-around into recognition + (when a provider exists) a 3D model,
-- and a small year/make/model catalog.
--
-- Nothing here fakes a result. A scan that has no reconstruction provider
-- stops at status 'waiting_provider' and the vehicle keeps its poster photo.

-- --------------------------------------------------------------------- jobs
-- Generic durable queue. Workers claim rows with FOR UPDATE SKIP LOCKED
-- (see src/lib/jobs.ts); failures back off exponentially on run_after.

create table jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed')),
  attempts int not null default 0,
  max_attempts int not null default 5,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index jobs_due_idx on jobs (status, run_after);

-- ------------------------------------------------------------ vehicle scans
-- One row per capture session. `capture` is the ScanCapture the phone sent,
-- `quality` / `recognition` / `model` are filled in by the pipeline stages
-- (src/lib/vehicles/scans.ts) and mirror the types in src/lib/vehicles/types.ts.

create table vehicle_scans (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references vehicles(id) on delete set null,
  owner_id uuid not null references profiles(id) on delete cascade,
  status text not null default 'queued' check (status in
    ('queued', 'validating', 'needs_retake', 'recognizing', 'reconstructing',
     'waiting_provider', 'complete', 'failed')),
  stage text,
  progress int not null default 0 check (progress between 0 and 100),
  capture jsonb not null default '{}'::jsonb,
  quality jsonb,
  recognition jsonb,
  model jsonb,
  provider text,
  external_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index vehicle_scans_owner_idx on vehicle_scans (owner_id);
create index vehicle_scans_vehicle_idx on vehicle_scans (vehicle_id);

-- ---------------------------------------------------------- vehicle catalog
-- Year / make / model lookup. `source` says where a row came from: 'vpic'
-- rows are cached from the NHTSA vPIC API, 'local' rows are the development
-- seed below.

create table vehicle_catalog (
  id uuid primary key default gen_random_uuid(),
  year int not null check (year between 1960 and 2035),
  make text not null,
  model text not null,
  trim text,
  body_type text,
  dims jsonb,
  source text not null check (source in ('vpic', 'local')),
  created_at timestamptz not null default now()
);
create unique index vehicle_catalog_key
  on vehicle_catalog (year, lower(make), lower(model), coalesce(trim, ''));
create index vehicle_catalog_year_make_idx on vehicle_catalog (year, lower(make));

-- DEVELOPMENT SEED. These rows exist so the catalog works offline and in
-- tests. They are a hand-typed sample of common US vehicles with approximate
-- exterior dimensions, not a licensed vehicle catalog. Production should set
-- VEHICLE_CATALOG_PROVIDER=vpic (see docs/vehicles.md).
insert into vehicle_catalog (year, make, model, trim, body_type, dims, source) values
  (2018, 'Toyota', 'Camry', 'LE', 'Sedan', '{"length_mm": 4880, "width_mm": 1840, "height_mm": 1445}', 'local'),
  (2021, 'Toyota', 'Camry', 'SE', 'Sedan', '{"length_mm": 4885, "width_mm": 1840, "height_mm": 1445}', 'local'),
  (2024, 'Toyota', 'Camry', null, 'Sedan', '{"length_mm": 4920, "width_mm": 1840, "height_mm": 1445}', 'local'),
  (2019, 'Toyota', 'RAV4', 'XLE', 'SUV', '{"length_mm": 4600, "width_mm": 1855, "height_mm": 1685}', 'local'),
  (2023, 'Toyota', 'RAV4', null, 'SUV', '{"length_mm": 4600, "width_mm": 1855, "height_mm": 1685}', 'local'),
  (2022, 'Toyota', 'Tacoma', 'SR5', 'Truck', '{"length_mm": 5392, "width_mm": 1910, "height_mm": 1793}', 'local'),
  (2018, 'Honda', 'Civic', 'EX', 'Sedan', '{"length_mm": 4630, "width_mm": 1800, "height_mm": 1415}', 'local'),
  (2022, 'Honda', 'Civic', 'Sport', 'Hatchback', '{"length_mm": 4550, "width_mm": 1800, "height_mm": 1415}', 'local'),
  (2025, 'Honda', 'Civic', null, 'Sedan', '{"length_mm": 4670, "width_mm": 1800, "height_mm": 1415}', 'local'),
  (2020, 'Honda', 'Accord', 'Sport', 'Sedan', '{"length_mm": 4900, "width_mm": 1860, "height_mm": 1450}', 'local'),
  (2021, 'Honda', 'CR-V', 'EX', 'SUV', '{"length_mm": 4620, "width_mm": 1855, "height_mm": 1690}', 'local'),
  (2024, 'Honda', 'CR-V', null, 'SUV', '{"length_mm": 4700, "width_mm": 1865, "height_mm": 1680}', 'local'),
  (2019, 'Ford', 'F-150', 'XLT', 'Truck', '{"length_mm": 5890, "width_mm": 2030, "height_mm": 1920}', 'local'),
  (2023, 'Ford', 'F-150', 'Lariat', 'Truck', '{"length_mm": 5910, "width_mm": 2030, "height_mm": 1960}', 'local'),
  (2020, 'Ford', 'Mustang', 'GT', 'Coupe', '{"length_mm": 4790, "width_mm": 1915, "height_mm": 1380}', 'local'),
  (2022, 'Ford', 'Explorer', 'XLT', 'SUV', '{"length_mm": 5050, "width_mm": 2005, "height_mm": 1775}', 'local'),
  (2018, 'Chevrolet', 'Silverado 1500', 'LT', 'Truck', '{"length_mm": 5840, "width_mm": 2030, "height_mm": 1880}', 'local'),
  (2023, 'Chevrolet', 'Silverado 1500', null, 'Truck', '{"length_mm": 5885, "width_mm": 2065, "height_mm": 1915}', 'local'),
  (2021, 'Chevrolet', 'Equinox', 'LT', 'SUV', '{"length_mm": 4650, "width_mm": 1845, "height_mm": 1660}', 'local'),
  (2019, 'Chevrolet', 'Malibu', 'LT', 'Sedan', '{"length_mm": 4925, "width_mm": 1855, "height_mm": 1465}', 'local'),
  (2019, 'BMW', '330i', null, 'Sedan', '{"length_mm": 4710, "width_mm": 1825, "height_mm": 1440}', 'local'),
  (2022, 'BMW', 'X3', 'xDrive30i', 'SUV', '{"length_mm": 4710, "width_mm": 1890, "height_mm": 1675}', 'local'),
  (2024, 'BMW', 'X5', 'xDrive40i', 'SUV', '{"length_mm": 4935, "width_mm": 2005, "height_mm": 1755}', 'local'),
  (2020, 'Tesla', 'Model 3', 'Long Range', 'Sedan', '{"length_mm": 4695, "width_mm": 1850, "height_mm": 1445}', 'local'),
  (2024, 'Tesla', 'Model 3', null, 'Sedan', '{"length_mm": 4720, "width_mm": 1850, "height_mm": 1440}', 'local'),
  (2021, 'Tesla', 'Model Y', 'Long Range', 'SUV', '{"length_mm": 4750, "width_mm": 1920, "height_mm": 1625}', 'local'),
  (2025, 'Tesla', 'Model Y', null, 'SUV', '{"length_mm": 4790, "width_mm": 1920, "height_mm": 1625}', 'local'),
  (2020, 'Hyundai', 'Elantra', 'SEL', 'Sedan', '{"length_mm": 4675, "width_mm": 1825, "height_mm": 1415}', 'local'),
  (2022, 'Hyundai', 'Tucson', 'SEL', 'SUV', '{"length_mm": 4630, "width_mm": 1865, "height_mm": 1665}', 'local'),
  (2023, 'Hyundai', 'Sonata', null, 'Sedan', '{"length_mm": 4900, "width_mm": 1860, "height_mm": 1445}', 'local'),
  (2021, 'Kia', 'Telluride', 'EX', 'SUV', '{"length_mm": 5000, "width_mm": 1990, "height_mm": 1750}', 'local'),
  (2022, 'Kia', 'Forte', 'LXS', 'Sedan', '{"length_mm": 4640, "width_mm": 1800, "height_mm": 1440}', 'local'),
  (2024, 'Kia', 'Sportage', null, 'SUV', '{"length_mm": 4660, "width_mm": 1865, "height_mm": 1655}', 'local'),
  (2019, 'Nissan', 'Altima', 'SV', 'Sedan', '{"length_mm": 4900, "width_mm": 1850, "height_mm": 1445}', 'local'),
  (2022, 'Nissan', 'Rogue', 'SV', 'SUV', '{"length_mm": 4650, "width_mm": 1840, "height_mm": 1690}', 'local'),
  (2020, 'Jeep', 'Wrangler', 'Sahara', 'SUV', '{"length_mm": 4785, "width_mm": 1875, "height_mm": 1840}', 'local'),
  (2023, 'Jeep', 'Grand Cherokee', 'Limited', 'SUV', '{"length_mm": 4915, "width_mm": 1980, "height_mm": 1795}', 'local'),
  (2021, 'Subaru', 'Outback', 'Premium', 'Wagon', '{"length_mm": 4860, "width_mm": 1855, "height_mm": 1680}', 'local'),
  (2024, 'Subaru', 'Crosstrek', null, 'Hatchback', '{"length_mm": 4480, "width_mm": 1800, "height_mm": 1600}', 'local'),
  (2020, 'Mercedes-Benz', 'C 300', null, 'Sedan', '{"length_mm": 4690, "width_mm": 1810, "height_mm": 1440}', 'local'),
  (2023, 'Mercedes-Benz', 'GLC 300', null, 'SUV', '{"length_mm": 4715, "width_mm": 1890, "height_mm": 1640}', 'local'),
  (2021, 'Audi', 'A4', 'Premium', 'Sedan', '{"length_mm": 4760, "width_mm": 1845, "height_mm": 1430}', 'local'),
  (2024, 'Audi', 'Q5', null, 'SUV', '{"length_mm": 4680, "width_mm": 1895, "height_mm": 1660}', 'local'),
  (2022, 'Lexus', 'RX 350', null, 'SUV', '{"length_mm": 4890, "width_mm": 1895, "height_mm": 1700}', 'local'),
  (2018, 'Lexus', 'ES 350', null, 'Sedan', '{"length_mm": 4900, "width_mm": 1820, "height_mm": 1450}', 'local');

-- ----------------------------------------------------------------- vehicles
-- Links from a vehicle to its scan output. `poster_url` is the still that
-- stands in for the 3D model until (and unless) one is built.

alter table vehicles
  add column if not exists scan_id uuid references vehicle_scans(id) on delete set null,
  add column if not exists model_glb_url text,
  add column if not exists poster_url text,
  add column if not exists recognition jsonb,
  add column if not exists catalog_id uuid references vehicle_catalog(id) on delete set null;

-- ---------------------------------------------------------------------- RLS

alter table jobs enable row level security;
alter table vehicle_scans enable row level security;
alter table vehicle_catalog enable row level security;

create policy vehicle_scans_owner on vehicle_scans for select using (owner_id = auth.uid() or is_admin());
create policy jobs_admin on jobs for select using (is_admin());
create policy vehicle_catalog_admin on vehicle_catalog for select using (is_admin());
