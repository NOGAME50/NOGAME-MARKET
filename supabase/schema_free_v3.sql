-- NOGAME MARKET v3 — marketplace gratuite, comptes commerciaux automatiques, modération par signalements.
-- À appliquer sur un projet Supabase de test après sauvegarde. Ne jamais exposer service_role.
create extension if not exists pgcrypto;

do $$ begin create type public.app_role as enum ('buyer','merchant','wholesaler','admin'); exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text, phone text, role public.app_role not null default 'buyer',
 account_status text not null default 'active' check(account_status in ('active','suspended')),
 trust_level text not null default 'new' check(trust_level in ('new','verified','trusted')),
 created_at timestamptz not null default now()
);

create table if not exists public.shops (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.profiles(id) on delete restrict,
 name text not null check(length(trim(name)) between 2 and 90), description text, logo_url text,
 is_active boolean not null default true, phone text, latitude double precision, longitude double precision, zone text,
 moderation_status text not null default 'visible' check(moderation_status in ('visible','review','hidden')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(latitude is null or latitude between -90 and 90), check(longitude is null or longitude between -180 and 180)
);

create table if not exists public.products (
 id uuid primary key default gen_random_uuid(), shop_id uuid not null references public.shops(id) on delete cascade,
 name text not null check(length(trim(name)) between 2 and 120), description text,
 price numeric(12,2) not null check(price >= 0), currency text not null default 'HTG',
 stock integer not null default 0 check(stock >= 0), image_url text, category text,
 is_active boolean not null default true,
 moderation_status text not null default 'visible' check(moderation_status in ('visible','review','hidden')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.favorites (
 user_id uuid not null references public.profiles(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,product_id)
);

create table if not exists public.reports (
 id uuid primary key default gen_random_uuid(), reporter_id uuid not null references public.profiles(id) on delete cascade,
 target_type text not null check(target_type in ('shop','product','user')),
 target_id uuid not null, reason text not null check(length(reason) between 2 and 60), details text not null check(length(trim(details)) between 10 and 1500),
 status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),
 created_at timestamptz not null default now(), reviewed_at timestamptz, reviewed_by uuid references public.profiles(id),
 unique(reporter_id,target_type,target_id)
);

create index if not exists shops_owner_idx on public.shops(owner_id);
create index if not exists products_shop_idx on public.products(shop_id);
create index if not exists reports_status_idx on public.reports(status,created_at desc);

-- Ces fonctions SECURITY DEFINER évitent les politiques RLS récursives.
create or replace function public.current_profile_role() returns public.app_role
language sql stable security definer set search_path=public as $$ select role from public.profiles where id=auth.uid() $$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and account_status='active') $$;
create or replace function public.is_commercial_user() returns boolean
language sql stable security definer set search_path=public as $$ select exists(select 1 from public.profiles where id=auth.uid() and role in ('merchant','wholesaler','admin') and account_status='active') $$;
create or replace function public.owns_shop(p_shop uuid) returns boolean
language sql stable security definer set search_path=public as $$ select exists(select 1 from public.shops where id=p_shop and owner_id=auth.uid()) $$;

-- À l'inscription, buyer/merchant/wholesaler sont acceptés; admin est toujours refusé.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
declare requested text; safe_role public.app_role;
begin
 requested := coalesce(new.raw_user_meta_data->>'requested_role','buyer');
 safe_role := case when requested='merchant' then 'merchant'::public.app_role when requested='wholesaler' then 'wholesaler'::public.app_role else 'buyer'::public.app_role end;
 insert into public.profiles(id,full_name,phone,role) values(new.id,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'phone',safe_role) on conflict(id) do nothing;
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Le propriétaire ne peut pas s'auto-attribuer un badge ou lever une modération.
create or replace function public.protect_moderation_fields() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is not null and not public.is_admin() then new.moderation_status := old.moderation_status; end if;
 new.updated_at := now(); return new;
end; $$;
drop trigger if exists protect_shop_moderation on public.shops;
create trigger protect_shop_moderation before update on public.shops for each row execute function public.protect_moderation_fields();
drop trigger if exists protect_product_moderation on public.products;
create trigger protect_product_moderation before update on public.products for each row execute function public.protect_moderation_fields();

-- 3 signalements distincts placent le contenu en revue; aucune suppression/suspension automatique.
create or replace function public.flag_reported_content() returns trigger
language plpgsql security definer set search_path=public as $$
declare n integer;
begin
 select count(distinct reporter_id) into n from public.reports where target_type=new.target_type and target_id=new.target_id and status in ('open','reviewing');
 if n>=3 then
  if new.target_type='shop' then update public.shops set moderation_status='review' where id=new.target_id;
  elsif new.target_type='product' then update public.products set moderation_status='review' where id=new.target_id;
  end if;
 end if;
 return new;
end; $$;
drop trigger if exists reports_flag_content on public.reports;
create trigger reports_flag_content after insert on public.reports for each row execute function public.flag_reported_content();

alter table public.profiles enable row level security;
alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.favorites enable row level security;
alter table public.reports enable row level security;

-- Profils : lecture propre uniquement. Les rôles/statuts ne sont jamais modifiables depuis le client.
drop policy if exists profile_read_self on public.profiles;
create policy profile_read_self on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());

-- Boutiques : visibles publiquement si actives et non en revue; propriétaires voient toutes les leurs.
drop policy if exists shops_public_read on public.shops;
create policy shops_public_read on public.shops for select to anon,authenticated using(is_active=true and moderation_status='visible');
drop policy if exists shops_owner_read on public.shops;
create policy shops_owner_read on public.shops for select to authenticated using(owner_id=auth.uid() or public.is_admin());
drop policy if exists shops_owner_insert on public.shops;
create policy shops_owner_insert on public.shops for insert to authenticated with check(owner_id=auth.uid() and public.is_commercial_user());
drop policy if exists shops_owner_update on public.shops;
create policy shops_owner_update on public.shops for update to authenticated using(owner_id=auth.uid() or public.is_admin()) with check(owner_id=auth.uid() or public.is_admin());
drop policy if exists shops_owner_delete on public.shops;
create policy shops_owner_delete on public.shops for delete to authenticated using((owner_id=auth.uid() and public.is_commercial_user()) or public.is_admin());

-- Produits : publication publique si boutique visible, stock disponible et produit visible.
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select to anon,authenticated using(is_active=true and stock>0 and moderation_status='visible' and exists(select 1 from public.shops s where s.id=shop_id and s.is_active=true and s.moderation_status='visible'));
drop policy if exists products_owner_read on public.products;
create policy products_owner_read on public.products for select to authenticated using(public.owns_shop(shop_id) or public.is_admin());
drop policy if exists products_owner_insert on public.products;
create policy products_owner_insert on public.products for insert to authenticated with check(public.owns_shop(shop_id) and public.is_commercial_user());
drop policy if exists products_owner_update on public.products;
create policy products_owner_update on public.products for update to authenticated using(public.owns_shop(shop_id) or public.is_admin()) with check(public.owns_shop(shop_id) or public.is_admin());
drop policy if exists products_owner_delete on public.products;
create policy products_owner_delete on public.products for delete to authenticated using(public.owns_shop(shop_id) or public.is_admin());

-- Favoris privés.
drop policy if exists favorites_owner_all on public.favorites;
create policy favorites_owner_all on public.favorites for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- Signalements : tout compte connecté peut signaler; auteur lit les siens; admin traite la file.
drop policy if exists reports_insert_self on public.reports;
create policy reports_insert_self on public.reports for insert to authenticated with check(reporter_id=auth.uid());
drop policy if exists reports_read_self_admin on public.reports;
create policy reports_read_self_admin on public.reports for select to authenticated using(reporter_id=auth.uid() or public.is_admin());
drop policy if exists reports_admin_update on public.reports;
create policy reports_admin_update on public.reports for update to authenticated using(public.is_admin()) with check(public.is_admin());

-- Storage : créer le bucket product-images en public dans Supabase Storage avant usage.
-- Les fichiers doivent être rangés dans un dossier dont le nom est l'UUID du propriétaire.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('product-images','product-images',true,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp'];
drop policy if exists product_images_public_read on storage.objects;
create policy product_images_public_read on storage.objects for select to anon,authenticated using(bucket_id='product-images');
drop policy if exists product_images_owner_insert on storage.objects;
create policy product_images_owner_insert on storage.objects for insert to authenticated with check(bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists product_images_owner_update on storage.objects;
create policy product_images_owner_update on storage.objects for update to authenticated using(bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists product_images_owner_delete on storage.objects;
create policy product_images_owner_delete on storage.objects for delete to authenticated using(bucket_id='product-images' and (storage.foldername(name))[1]=auth.uid()::text);

-- IMPORTANT : attribution initiale admin à faire manuellement dans SQL Editor, après création du compte :
-- update public.profiles set role='admin' where id='UUID_AUTH_USER';
-- Ne jamais mettre une clé service_role dans l'application.

-- Les administrateurs peuvent modérer les comptes (les utilisateurs ne disposent d'aucune policy UPDATE).
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles for update to authenticated using(public.is_admin()) with check(public.is_admin());
