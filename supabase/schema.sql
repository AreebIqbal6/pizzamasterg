-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Branches Table
create table public.branches (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  location text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Menu Items Table
create table public.menu_items (
  id uuid default uuid_generate_v4() primary key,
  category text not null,
  name text not null,
  description text,
  price numeric not null,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Orders Table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id),
  branch_id uuid references public.branches(id), -- Made nullable for guest/demo testing
  total numeric not null,
  status text not null check (status in ('pending', 'preparing', 'on-the-way', 'completed', 'cancelled')),
  customer_name text not null,
  customer_address text not null,
  items jsonb not null, -- Array of ordered items
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.branches enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;

-- Setup RLS Policies

-- Branches & Menu are public to read
create policy "Branches are viewable by everyone" on public.branches for select using (true);
create policy "Menu items are viewable by everyone" on public.menu_items for select using (true);

-- Orders RLS
create policy "Users can view their own orders" on public.orders for select using (auth.uid() = user_id);
create policy "Anyone can insert orders" on public.orders for insert with check (true);

-- Seed Branches
insert into public.branches (name, location) values 
('Gulshan-e-Iqbal Block 2', 'Gulshan-e-Iqbal'),
('North Karachi Anda Mor', 'North Karachi'),
('F.B. Area Sagheer Center', 'F.B. Area');

-- Kitchen users can view and update orders for their branch
-- Requires user_metadata to have role='kitchen' and branch_id
create policy "Kitchen can view branch orders" on public.orders for select using (
  auth.jwt() ->> 'role' = 'kitchen' AND (auth.jwt() ->> 'branch_id')::uuid = branch_id
);
create policy "Kitchen can update branch orders" on public.orders for update using (
  auth.jwt() ->> 'role' = 'kitchen' AND (auth.jwt() ->> 'branch_id')::uuid = branch_id
);

-- Admin users can view and update all orders
create policy "Admin can view all orders" on public.orders for select using (auth.jwt() ->> 'role' = 'admin');
create policy "Admin can update all orders" on public.orders for update using (auth.jwt() ->> 'role' = 'admin');

-- Realtime setup
alter publication supabase_realtime add table public.orders;

-- Create Inventory Items Table
create table public.inventory_items (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  unit text not null, -- e.g., kg, boxes, liters
  total_quantity numeric default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Inventory Allocations Table
create table public.inventory_allocations (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references public.inventory_items(id) not null,
  branch_id uuid references public.branches(id) not null,
  quantity numeric not null,
  allocated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Reviews Table
create table public.reviews (
  id uuid default uuid_generate_v4() primary key,
  order_id uuid references public.orders(id) not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.inventory_items enable row level security;
alter table public.inventory_allocations enable row level security;
alter table public.reviews enable row level security;

-- Admin can manage inventory
create policy "Admin can manage inventory items" on public.inventory_items using (auth.jwt() ->> 'role' = 'admin');
create policy "Admin can manage inventory allocations" on public.inventory_allocations using (auth.jwt() ->> 'role' = 'admin');

-- Kitchen can view allocations for their branch
create policy "Kitchen can view their allocations" on public.inventory_allocations for select using (
  auth.jwt() ->> 'role' = 'kitchen' AND (auth.jwt() ->> 'branch_id')::uuid = branch_id
);

-- Customers can insert reviews
create policy "Customers can insert reviews" on public.reviews for insert with check (true);
create policy "Everyone can read reviews" on public.reviews for select using (true);
