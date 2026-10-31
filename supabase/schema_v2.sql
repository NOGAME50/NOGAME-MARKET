-- NOGAME MARKET — schéma de base à appliquer sur un projet Supabase neuf.
-- À faire relire et tester avant production. Ne jamais exposer service_role dans le navigateur.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('buyer','merchant','wholesaler','admin');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role public.app_role not null default 'buyer',
  created_at timestamptz not null default now()
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  duration_months integer not null check (duration_months in (1,6,12)),
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'HTG',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  description text,
  logo_url text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.seller_subscriptions (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  starts_at timestamptz,
  ends_at timestamptz,
  status text not null default 'pending' check (status in ('pending','active','expired','rejected')),
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  check ((status <> 'active') or (starts_at is not null and ends_at is not null and verified_at is not null))
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references public.shops(id) on delete cascade,
  name text not null,
  description text,
  price numeric(12,2) not null check (price >= 0),
  currency text not null default 'HTG',
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  category text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.seller_subscriptions(id) on delete cascade,
  provider text not null check (provider in ('moncash','natcash','manual')),
  reference text,
  proof_url text,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending','confirmed','rejected')),
  submitted_by uuid not null references public.profiles(id),
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, product_id)
);

create or replace function public.has_active_shop_subscription(p_shop_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.seller_subscriptions s
    where s.shop_id = p_shop_id and s.status = 'active'
      and s.starts_at <= now() and s.ends_at > now()
  );
$$;

-- Create profile from Auth metadata. requested_role is deliberately ignored:
-- public signup always starts as buyer. A trusted admin process can grant merchant/wholesaler.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, phone, role)
  values(new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'phone', 'buyer')
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.shops enable row level security;
alter table public.seller_subscriptions enable row level security;
alter table public.products enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "profile read own" on public.profiles;
create policy "profile read own" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profile update own basic fields" on public.profiles;
create policy "profile update own basic fields" on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid() and role = (select p.role from public.profiles p where p.id = auth.uid()));

drop policy if exists "plans public read" on public.subscription_plans;
create policy "plans public read" on public.subscription_plans for select to anon, authenticated using (is_active = true);

drop policy if exists "shops public active subscription" on public.shops;
create policy "shops public active subscription" on public.shops for select to anon, authenticated
using (is_active = true and public.has_active_shop_subscription(id));
drop policy if exists "owners read own shops" on public.shops;
create policy "owners read own shops" on public.shops for select to authenticated using (owner_id = auth.uid());
drop policy if exists "owners create own shops" on public.shops;
create policy "owners create own shops" on public.shops for insert to authenticated
with check (owner_id = auth.uid() and exists(select 1 from public.profiles p where p.id = auth.uid() and p.role in ('merchant','wholesaler')));
drop policy if exists "owners update own shop details" on public.shops;
create policy "owners update own shop details" on public.shops for update to authenticated
using (owner_id = auth.uid()) with check (owner_id = auth.uid() and is_active = false);

drop policy if exists "products public active shop" on public.products;
create policy "products public active shop" on public.products for select to anon, authenticated
using (is_active = true and stock > 0 and public.has_active_shop_subscription(shop_id)
  and exists(select 1 from public.shops s where s.id = shop_id and s.is_active = true));
drop policy if exists "owners read own products" on public.products;
create policy "owners read own products" on public.products for select to authenticated
using (exists(select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));
drop policy if exists "owners add products" on public.products;
create policy "owners add products" on public.products for insert to authenticated
with check (exists(select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));
drop policy if exists "owners update own products" on public.products;
create policy "owners update own products" on public.products for update to authenticated
using (exists(select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()))
with check (exists(select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

drop policy if exists "subscription owner read" on public.seller_subscriptions;
create policy "subscription owner read" on public.seller_subscriptions for select to authenticated
using (exists(select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));
-- No browser-side insert/update policies for subscription activation or payment verification.
-- Implement a trusted Edge Function + payment-provider verification/admin approval.

drop policy if exists "payment owner read" on public.payment_transactions;
create policy "payment owner read" on public.payment_transactions for select to authenticated
using (submitted_by = auth.uid() or exists(select 1 from public.seller_subscriptions ss join public.shops s on s.id=ss.shop_id where ss.id=subscription_id and s.owner_id=auth.uid()));
-- No public insert/update policy. Create payment requests through a validated Edge Function.

drop policy if exists "favorite owner manage" on public.favorites;
create policy "favorite owner manage" on public.favorites for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Important production notes:
-- 1) Configure admin assignment outside public signup, using a trusted server process.
-- 2) Add order/cart/delivery/ticket/notification tables before enabling those modules.
-- 3) Build a trusted Edge Function for payment proof submission and verification.
-- 4) Validate image uploads with Storage bucket policies and file size/type restrictions.
-- 5) Test every RLS policy with anon, buyer, merchant, wholesaler and admin test accounts.
