-- ═══════════════════════════════════════════════
-- MOTO CARE PRO — Supabase Database Schema
-- Run this entire file in Supabase SQL Editor
-- ═══════════════════════════════════════════════

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── PROFILES (extends Supabase auth.users) ───
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'mechanic' check (role in ('admin','owner','mechanic')),
  garage_name text default 'Moto Care Pro',
  phone text,
  created_at timestamptz default now()
);

-- ─── CUSTOMERS ───
create table if not exists customers (
  id bigserial primary key,
  service_code text unique not null,
  customer_name text not null,
  mobile_number text not null,
  vehicle_number text not null,
  vehicle_type text not null default 'Bike' check (vehicle_type in ('Bike','Car','Heavy Vehicle')),
  bike_model text,
  last_service_km int,
  service_interval int default 45,
  service_date date,
  next_service_date date,
  oil_change_date date,
  oil_reminder_sent boolean default false,
  repeat_reminder_sent_on date,
  customer_type text default 'regular',
  created_at timestamptz default now()
);

-- ─── SERVICE JOBS ───
create table if not exists jobs (
  id bigserial primary key,
  customer_id bigint references customers(id) on delete set null,
  customer_name text not null,
  phone text,
  vehicle_number text not null,
  vehicle_type text not null default 'Bike',
  bike_model text,
  service_type text not null,
  mechanic text,
  service_date date not null default current_date,
  next_service_date date,
  estimated_amount numeric(10,2) default 0,
  status text not null default 'Pending' check (status in ('Pending','In Progress','Completed')),
  notes text,
  created_at timestamptz default now()
);

-- ─── INVOICES ───
create table if not exists invoices (
  id bigserial primary key,
  invoice_no text unique not null,
  invoice_date date not null default current_date,
  customer_id bigint references customers(id) on delete set null,
  customer_name text not null,
  vehicle_number text,
  description text,
  price_lines jsonb default '[]',
  amount numeric(10,2) default 0,
  payment_status text not null default 'Pending' check (payment_status in ('Pending','Paid','Refunded','Partial')),
  paid_amount numeric(10,2) default 0,
  paid_at date,
  refund_amount numeric(10,2) default 0,
  refund_reason text,
  refunded_at date,
  created_at timestamptz default now()
);

-- ─── INVENTORY ───
create table if not exists inventory (
  id bigserial primary key,
  name text not null,
  supplier text,
  stock int not null default 0,
  min_stock int not null default 5,
  price numeric(10,2) default 0,
  units_sold int default 0,
  created_at timestamptz default now()
);

-- ─── PURCHASES (expenses) ───
create table if not exists purchases (
  id bigserial primary key,
  part_name text not null,
  supplier text,
  quantity int not null default 1,
  unit_cost numeric(10,2) not null default 0,
  total_cost numeric(10,2) generated always as (quantity * unit_cost) stored,
  purchase_date date not null default current_date,
  mechanic text,
  notes text,
  created_at timestamptz default now()
);

-- ─── MECHANICS ───
create table if not exists mechanics (
  id bigserial primary key,
  name text not null,
  phone text,
  role text default 'Mechanic',
  specialization text,
  joining_date date,
  active boolean default true,
  created_at timestamptz default now()
);

-- ─── MECHANIC PARTS TRANSACTIONS ───
create table if not exists mechanic_transactions (
  id bigserial primary key,
  mechanic_id bigint references mechanics(id) on delete cascade,
  mechanic_name text,
  transaction_type text not null check (transaction_type in ('sold','used','purchased')),
  item_name text not null,
  quantity int default 1,
  unit_price numeric(10,2) default 0,
  total_value numeric(10,2) generated always as (quantity * unit_price) stored,
  job_id bigint references jobs(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

-- ─── SERVICE BOOKINGS ───
create table if not exists bookings (
  id bigserial primary key,
  customer_name text not null,
  phone text not null,
  vehicle_number text,
  vehicle_type text default 'Bike',
  service_type text not null,
  booking_date date not null,
  booking_time text not null default '10:00 AM',
  status text not null default 'Pending' check (status in ('Pending','Confirmed','Completed','Cancelled')),
  notes text,
  created_at timestamptz default now()
);

-- ─── INSPECTIONS ───
create table if not exists inspections (
  id bigserial primary key,
  customer_name text not null,
  vehicle_number text not null,
  vehicle_type text default 'Bike',
  mechanic text,
  inspection_date date not null default current_date,
  checks jsonb default '{}',
  overall_status text default 'Pending' check (overall_status in ('Pending','Good','Needs Attention','Critical')),
  notes text,
  created_at timestamptz default now()
);

-- ─── SERVICE HISTORY ───
create table if not exists service_history (
  id bigserial primary key,
  customer_id bigint references customers(id) on delete cascade,
  service_code text,
  service_km int,
  service_date date,
  service_type text,
  amount numeric(10,2) default 0,
  mechanic text,
  notes text,
  created_at timestamptz default now()
);

-- ─── SEED DEMO DATA ───

-- Mechanics
insert into mechanics (name, phone, role, specialization, joining_date) values
  ('Senthil Kumar', '9876541111', 'Senior Mechanic', 'Engine & Transmission', '2021-06-01'),
  ('Karthik Raja',  '9876542222', 'Mechanic',        'Electrical & AC',       '2022-03-15'),
  ('Anbu Selvan',   '9876543333', 'Junior Mechanic', 'General Service',       '2023-01-10')
on conflict do nothing;

-- Inventory
insert into inventory (name, supplier, stock, min_stock, price, units_sold) values
  ('Engine Oil 1L (20W-40)', 'Castrol',        45, 10, 450, 120),
  ('Oil Filter (Bike)',       'Bosch',           8, 15, 150,  85),
  ('Brake Pads (Front)',      'Brembo',         22, 10, 600,  48),
  ('Air Filter',              'K&N',             3, 10, 250,  62),
  ('Clutch Plate Set',        'Bajaj Parts',     6,  5,1800,  18),
  ('Spark Plug (NGK)',        'NGK',            30, 15, 180,  95),
  ('Coolant 1L',              'Prestone',       18,  8, 320,  34),
  ('Brake Fluid DOT4',        'Castrol',         4,  8, 300,  28)
on conflict do nothing;

-- Customers
insert into customers (service_code, customer_name, mobile_number, vehicle_number, vehicle_type, bike_model, service_interval, service_date, next_service_date, oil_change_date) values
  ('SC001','Ravi Kumar',     '9876543210','TN01AB1234','Bike',          'Royal Enfield Classic 350', 45,'2025-03-15','2025-04-29','2025-03-15'),
  ('SC002','Priya Sundaram', '9843210987','TN09CD5678','Car',           'Maruti Swift Dzire',        75,'2025-02-20','2025-05-06','2025-02-20'),
  ('SC003','Vijay Mohan',    '8765432109','TN22EF9012','Bike',          'Honda CB Shine',            45,'2025-01-10','2025-02-24','2025-01-10'),
  ('SC004','Lakshmi Devi',   '7654321098','TN33GH3456','Car',           'Hyundai i20',               75,'2025-03-01','2025-05-15','2025-03-01'),
  ('SC005','Murugan R',      '9543219876','TN44IJ7890','Heavy Vehicle', 'Tata ACE',                  30,'2025-03-25','2025-04-24','2025-03-25')
on conflict do nothing;

-- Jobs
insert into jobs (customer_name, phone, vehicle_number, vehicle_type, service_type, mechanic, service_date, estimated_amount, status, notes) values
  ('Ravi Kumar',     '9876543210','TN01AB1234','Bike',          'General Service','Senthil Kumar','2025-04-18',1850,'Completed','Changed oil, filter. Brake pads worn.'),
  ('Priya Sundaram', '9843210987','TN09CD5678','Car',           'Full Service',   'Karthik Raja', '2025-04-19',5500,'In Progress','AC gas top up needed.'),
  ('Vijay Mohan',    '8765432109','TN22EF9012','Bike',          'Oil Change',     'Anbu Selvan',  '2025-04-20', 650,'Pending',''),
  ('Lakshmi Devi',   '7654321098','TN33GH3456','Car',           'Repair Work',    'Senthil Kumar','2025-04-17',3200,'Completed','Clutch plate replacement.'),
  ('Murugan R',      '9543219876','TN44IJ7890','Heavy Vehicle', 'General Service','Karthik Raja', '2025-04-16',7800,'Completed','Brake overhaul.')
on conflict do nothing;

-- Invoices
insert into invoices (invoice_no, invoice_date, customer_name, vehicle_number, price_lines, amount, payment_status, paid_amount) values
  ('INV-001','2025-04-18','Ravi Kumar',    'TN01AB1234','[{"name":"Labour","qty":1,"rate":800},{"name":"Engine Oil 1L","qty":2,"rate":450},{"name":"Oil Filter","qty":1,"rate":150}]',1850,'Paid',1850),
  ('INV-002','2025-04-17','Lakshmi Devi',  'TN33GH3456','[{"name":"Labour","qty":1,"rate":1200},{"name":"Clutch Plate","qty":1,"rate":1800},{"name":"Bearing","qty":2,"rate":100}]',3200,'Pending',0),
  ('INV-003','2025-04-16','Murugan R',     'TN44IJ7890','[{"name":"Labour","qty":1,"rate":3000},{"name":"Brake Pads","qty":4,"rate":600},{"name":"Brake Fluid","qty":2,"rate":300}]',7800,'Paid',7800),
  ('INV-004','2025-04-15','Rahul Sharma',  'TN02XY3344','[{"name":"Labour","qty":1,"rate":500},{"name":"Air Filter","qty":1,"rate":250}]',750,'Refunded',750)
on conflict do nothing;

-- Purchases
insert into purchases (part_name, supplier, quantity, unit_cost, purchase_date) values
  ('Engine Oil 20W-40 (12L Can)', 'Castrol Distributors',  5, 840, '2025-04-10'),
  ('Brake Pads Assorted',          'Parts Hub Chennai',    20, 425, '2025-04-12'),
  ('Spark Plugs NGK (Box 10)',     'NGK Authorized',        3, 900, '2025-04-14'),
  ('Oil Filters Bulk',             'Parts Hub Chennai',    50, 100, '2025-04-15'),
  ('Clutch Plate Sets',            'Bajaj Parts Depot',     4,1400, '2025-04-17')
on conflict do nothing;

-- Bookings
insert into bookings (customer_name, phone, vehicle_number, vehicle_type, service_type, booking_date, booking_time, status) values
  ('Arjun Nair',     '9876012345','TN07KL8899','Bike','General Service','2025-04-21','10:00 AM','Confirmed'),
  ('Meena Ramesh',   '8765109876','TN15MN2233','Car', 'Oil Change',     '2025-04-21','11:30 AM','Pending'),
  ('Babu Krishnan',  '7654298765','TN33PQ5566','Bike','Repair Work',    '2025-04-22','09:00 AM','Confirmed'),
  ('Kavitha Sunder', '9543187654','TN02RS7788','Car', 'Full Service',   '2025-04-23','02:00 PM','Pending')
on conflict do nothing;

-- ─── ROW LEVEL SECURITY (basic) ───
alter table customers        enable row level security;
alter table jobs             enable row level security;
alter table invoices         enable row level security;
alter table inventory        enable row level security;
alter table purchases        enable row level security;
alter table mechanics        enable row level security;
alter table mechanic_transactions enable row level security;
alter table bookings         enable row level security;
alter table inspections      enable row level security;
alter table service_history  enable row level security;

-- Allow all operations for authenticated users (you can tighten per role later)
create policy "auth_all" on customers             for all to authenticated using (true) with check (true);
create policy "auth_all" on jobs                  for all to authenticated using (true) with check (true);
create policy "auth_all" on invoices              for all to authenticated using (true) with check (true);
create policy "auth_all" on inventory             for all to authenticated using (true) with check (true);
create policy "auth_all" on purchases             for all to authenticated using (true) with check (true);
create policy "auth_all" on mechanics             for all to authenticated using (true) with check (true);
create policy "auth_all" on mechanic_transactions for all to authenticated using (true) with check (true);
create policy "auth_all" on bookings              for all to authenticated using (true) with check (true);
create policy "auth_all" on inspections           for all to authenticated using (true) with check (true);
create policy "auth_all" on service_history       for all to authenticated using (true) with check (true);
