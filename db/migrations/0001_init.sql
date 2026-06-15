-- =====================================================================
-- KAFOO MARKETPLACE - Schéma initial complet
-- À exécuter dans le SQL Editor de TON projet Supabase personnel.
-- (Dashboard Supabase > SQL Editor > New query > coller > Run)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ============== ENUMS ==============
do $$ begin create type public.app_role as enum ('super_admin','admin','moderator','professional','user');
exception when duplicate_object then null; end $$;
do $$ begin create type public.account_type as enum ('particulier','professionnel');
exception when duplicate_object then null; end $$;
do $$ begin create type public.account_status as enum ('active','suspended','banned','deleted');
exception when duplicate_object then null; end $$;
do $$ begin create type public.listing_status as enum ('draft','pending','published','rejected','suspended','expired','sold','deleted');
exception when duplicate_object then null; end $$;
do $$ begin create type public.listing_condition as enum ('neuf','tres_bon','bon','moyen','a_reparer');
exception when duplicate_object then null; end $$;
do $$ begin create type public.listing_kind as enum ('vente','echange','don','recherche');
exception when duplicate_object then null; end $$;
do $$ begin create type public.seller_type as enum ('particulier','professionnel');
exception when duplicate_object then null; end $$;

-- ============== LOCALISATIONS ==============
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  name text not null, code text not null unique, slug text not null unique,
  is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid not null references public.countries(id) on delete cascade,
  name text not null, slug text not null,
  is_active boolean not null default true, created_at timestamptz not null default now(),
  unique(country_id, slug)
);
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  region_id uuid not null references public.regions(id) on delete cascade,
  name text not null, slug text not null,
  latitude double precision, longitude double precision,
  is_active boolean not null default true, created_at timestamptz not null default now(),
  unique(region_id, slug)
);
create table if not exists public.communes (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name text not null, slug text not null,
  latitude double precision, longitude double precision,
  is_active boolean not null default true, created_at timestamptz not null default now(),
  unique(city_id, slug)
);
create table if not exists public.districts (
  id uuid primary key default gen_random_uuid(),
  commune_id uuid not null references public.communes(id) on delete cascade,
  name text not null, slug text not null,
  latitude double precision, longitude double precision,
  is_active boolean not null default true, created_at timestamptz not null default now(),
  unique(commune_id, slug)
);

-- ============== CATÉGORIES ==============
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete cascade,
  name text not null, slug text not null unique,
  description text, icon text, image_url text,
  is_active boolean not null default true, sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ============== PROFILES ==============
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text, last_name text, display_name text, business_name text,
  email text, phone text, whatsapp text, avatar_url text,
  account_type public.account_type not null default 'particulier',
  country_id uuid references public.countries(id),
  region_id uuid references public.regions(id),
  city_id uuid references public.cities(id),
  commune_id uuid references public.communes(id),
  district_id uuid references public.districts(id),
  bio text,
  status public.account_status not null default 'active',
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============== USER ROLES (séparé — sécurité) ==============
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','super_admin','moderator'))
$$;

-- ============== LISTINGS ==============
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  subcategory_id uuid references public.categories(id),
  title text not null, slug text not null unique, description text not null,
  price numeric(14,2), currency text not null default 'GNF',
  condition public.listing_condition,
  listing_type public.listing_kind not null default 'vente',
  seller_type public.seller_type not null default 'particulier',
  country_id uuid references public.countries(id),
  region_id uuid references public.regions(id),
  city_id uuid references public.cities(id),
  commune_id uuid references public.communes(id),
  district_id uuid references public.districts(id),
  address_text text, latitude double precision, longitude double precision,
  phone_visible boolean not null default true,
  whatsapp_enabled boolean not null default true,
  negotiable boolean not null default false,
  status public.listing_status not null default 'pending',
  is_featured boolean not null default false,
  is_urgent boolean not null default false,
  is_sponsored boolean not null default false,
  views_count int not null default 0,
  favorites_count int not null default 0,
  contacts_count int not null default 0,
  published_at timestamptz, expires_at timestamptz, sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_listings_status on public.listings(status);
create index if not exists idx_listings_category on public.listings(category_id);
create index if not exists idx_listings_region on public.listings(region_id);
create index if not exists idx_listings_city on public.listings(city_id);
create index if not exists idx_listings_commune on public.listings(commune_id);
create index if not exists idx_listings_price on public.listings(price);
create index if not exists idx_listings_created on public.listings(created_at desc);
create index if not exists idx_listings_user on public.listings(user_id);
create index if not exists idx_listings_geo on public.listings(latitude, longitude);

create table if not exists public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  image_url text not null, storage_path text,
  is_main boolean not null default false, sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_listing_images_listing on public.listing_images(listing_id);

-- ============== FAVORITES / MESSAGES / REPORTS / NOTIF / SHOPS / SETTINGS ==============
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, listing_id)
);
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  last_message text, last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique(listing_id, buyer_id, seller_id)
);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  receiver_id uuid not null references auth.users(id) on delete cascade,
  content text not null, is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_messages_conv on public.messages(conversation_id, created_at);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid references auth.users(id) on delete cascade,
  reason text not null, description text,
  status text not null default 'open', admin_note text,
  created_at timestamptz not null default now(), resolved_at timestamptz
);
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null, message text not null, type text,
  is_read boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.shops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  business_name text not null, logo_url text, description text,
  phone text, email text, website text,
  country_id uuid references public.countries(id),
  region_id uuid references public.regions(id),
  city_id uuid references public.cities(id),
  commune_id uuid references public.communes(id),
  district_id uuid references public.districts(id),
  is_verified boolean not null default false, status text not null default 'active',
  created_at timestamptz not null default now()
);
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============== GRANTS ==============
grant select on public.countries, public.regions, public.cities, public.communes, public.districts to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select on public.listings, public.listing_images to anon, authenticated;
grant select on public.shops, public.settings to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.listings, public.listing_images to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert, update on public.conversations, public.messages to authenticated;
grant select, insert on public.reports to authenticated;
grant select, update on public.notifications to authenticated;
grant select, insert, update, delete on public.shops to authenticated;
grant select on public.user_roles to authenticated;
grant all on all tables in schema public to service_role;

-- ============== RLS ==============
alter table public.countries enable row level security;
alter table public.regions enable row level security;
alter table public.cities enable row level security;
alter table public.communes enable row level security;
alter table public.districts enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.favorites enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.shops enable row level security;
alter table public.settings enable row level security;

create policy "read countries" on public.countries for select using (true);
create policy "read regions"   on public.regions   for select using (true);
create policy "read cities"    on public.cities    for select using (true);
create policy "read communes"  on public.communes  for select using (true);
create policy "read districts" on public.districts for select using (true);
create policy "read categories" on public.categories for select using (true);
create policy "read settings"  on public.settings   for select using (true);

create policy "admin write countries" on public.countries for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin write regions"   on public.regions   for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin write cities"    on public.cities    for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin write communes"  on public.communes  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin write districts" on public.districts for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin write categories" on public.categories for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "admin write settings"  on public.settings  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "profiles public read" on public.profiles for select using (true);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = user_id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "profiles admin all"   on public.profiles for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "roles self read"  on public.user_roles for select using (auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "roles admin all"  on public.user_roles for all to authenticated using (public.has_role(auth.uid(),'super_admin')) with check (public.has_role(auth.uid(),'super_admin'));

create policy "listings public read" on public.listings for select using (status = 'published' or auth.uid() = user_id or public.is_admin(auth.uid()));
create policy "listings owner insert" on public.listings for insert to authenticated with check (auth.uid() = user_id);
create policy "listings owner update" on public.listings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "listings owner delete" on public.listings for delete to authenticated using (auth.uid() = user_id);
create policy "listings admin all"   on public.listings for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "images public read" on public.listing_images for select using (
  exists (select 1 from public.listings l where l.id = listing_id and (l.status = 'published' or l.user_id = auth.uid() or public.is_admin(auth.uid())))
);
create policy "images owner write" on public.listing_images for all to authenticated using (
  exists (select 1 from public.listings l where l.id = listing_id and l.user_id = auth.uid())
) with check (
  exists (select 1 from public.listings l where l.id = listing_id and l.user_id = auth.uid())
);

create policy "favorites owner all" on public.favorites for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "conv participants read"   on public.conversations for select to authenticated using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "conv buyer insert"        on public.conversations for insert to authenticated with check (auth.uid() = buyer_id);
create policy "conv participants update" on public.conversations for update to authenticated using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "msg participants read"    on public.messages for select to authenticated using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "msg sender insert"        on public.messages for insert to authenticated with check (auth.uid() = sender_id);
create policy "msg receiver update"      on public.messages for update to authenticated using (auth.uid() = receiver_id);

create policy "reports user insert" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy "reports admin read"  on public.reports for select to authenticated using (public.is_admin(auth.uid()) or auth.uid() = reporter_id);
create policy "reports admin update" on public.reports for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "notif self read"   on public.notifications for select to authenticated using (auth.uid() = user_id);
create policy "notif self update" on public.notifications for update to authenticated using (auth.uid() = user_id);

create policy "shops public read" on public.shops for select using (true);
create policy "shops owner write" on public.shops for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============== TRIGGERS ==============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email, display_name, account_type)
  values (new.id, new.email,
          coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)),
          coalesce((new.raw_user_meta_data->>'account_type')::public.account_type,'particulier'))
  on conflict (user_id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.touch_updated_at();
drop trigger if exists trg_listings_updated on public.listings;
create trigger trg_listings_updated before update on public.listings for each row execute function public.touch_updated_at();

-- ============== SEED CATÉGORIES ==============
insert into public.categories (name, slug, icon, sort_order) values
('Téléphones et tablettes','telephones-tablettes','smartphone',1),
('Ordinateurs et accessoires','ordinateurs','laptop',2),
('Électronique','electronique','tv',3),
('Véhicules','vehicules','car',4),
('Motos','motos','bike',5),
('Immobilier','immobilier','home',6),
('Meubles','meubles','sofa',7),
('Électroménager','electromenager','refrigerator',8),
('Mode et vêtements','mode','shirt',9),
('Chaussures','chaussures','footprints',10),
('Bijoux et accessoires','bijoux','gem',11),
('Bébé et enfants','bebe-enfants','baby',12),
('Maison et jardin','maison-jardin','flower',13),
('Sport et loisirs','sport-loisirs','dumbbell',14),
('Matériel professionnel','materiel-pro','briefcase',15),
('Services','services','wrench',16),
('Emploi','emploi','user-tie',17),
('Animaux','animaux','dog',18),
('Livres et fournitures','livres','book',19),
('Autres','autres','box',20)
on conflict (slug) do nothing;

-- ============== SEED GUINÉE ==============
insert into public.countries (name, code, slug) values ('Guinée','GN','guinee') on conflict (code) do nothing;

with c as (select id from public.countries where code='GN')
insert into public.regions (country_id, name, slug)
select c.id, r.name, r.slug from c, (values
  ('Conakry','conakry'),('Boké','boke'),('Kindia','kindia'),('Mamou','mamou'),
  ('Labé','labe'),('Faranah','faranah'),('Kankan','kankan'),('Nzérékoré','nzerekore')
) as r(name, slug)
on conflict do nothing;

with r as (select id from public.regions where slug='conakry')
insert into public.cities (region_id, name, slug, latitude, longitude)
select r.id, 'Conakry','conakry', 9.6412, -13.5784 from r
on conflict do nothing;

with city as (select id from public.cities where slug='conakry')
insert into public.communes (city_id, name, slug, latitude, longitude)
select city.id, c.name, c.slug, c.lat, c.lng from city, (values
  ('Kaloum','kaloum',9.5092,-13.7122),
  ('Dixinn','dixinn',9.5400,-13.6800),
  ('Matam','matam',9.5500,-13.6700),
  ('Ratoma','ratoma',9.6300,-13.6300),
  ('Matoto','matoto',9.5900,-13.5500)
) as c(name, slug, lat, lng)
on conflict do nothing;

do $$
declare r record;
begin
  for r in select id, slug from public.communes loop
    case r.slug
      when 'kaloum' then
        insert into public.districts (commune_id,name,slug) values
          (r.id,'Almamya','almamya'),(r.id,'Sandervalia','sandervalia'),
          (r.id,'Manquepas','manquepas'),(r.id,'Coronthie','coronthie')
        on conflict do nothing;
      when 'dixinn' then
        insert into public.districts (commune_id,name,slug) values
          (r.id,'Dixinn Centre','dixinn-centre'),(r.id,'Bellevue','bellevue'),
          (r.id,'Camayenne','camayenne'),(r.id,'Donka','donka'),(r.id,'Landreah','landreah')
        on conflict do nothing;
      when 'matam' then
        insert into public.districts (commune_id,name,slug) values
          (r.id,'Matam Centre','matam-centre'),(r.id,'Bonfi','bonfi'),
          (r.id,'Carrière','carriere'),(r.id,'Coleah','coleah')
        on conflict do nothing;
      when 'ratoma' then
        insert into public.districts (commune_id,name,slug) values
          (r.id,'Kipé','kipe'),(r.id,'Lambanyi','lambanyi'),(r.id,'Nongo','nongo'),
          (r.id,'Taouyah','taouyah'),(r.id,'Kaporo','kaporo'),(r.id,'Hamdallaye','hamdallaye'),
          (r.id,'Cosa','cosa'),(r.id,'Bambeto','bambeto'),(r.id,'Wanindara','wanindara')
        on conflict do nothing;
      when 'matoto' then
        insert into public.districts (commune_id,name,slug) values
          (r.id,'Matoto Centre','matoto-centre'),(r.id,'Gbessia','gbessia'),
          (r.id,'Tombolia','tombolia'),(r.id,'Tanéné','tanene'),
          (r.id,'Enta','enta'),(r.id,'Kissosso','kissosso'),(r.id,'Sangoyah','sangoyah')
        on conflict do nothing;
      else null;
    end case;
  end loop;
end $$;

-- ============== STORAGE ==============
insert into storage.buckets (id, name, public) values ('listings','listings', true)
on conflict (id) do nothing;

do $$ begin
  create policy "listings storage read" on storage.objects for select using (bucket_id = 'listings');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "listings storage owner write" on storage.objects for insert to authenticated
    with check (bucket_id = 'listings' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "listings storage owner update" on storage.objects for update to authenticated
    using (bucket_id = 'listings' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "listings storage owner delete" on storage.objects for delete to authenticated
    using (bucket_id = 'listings' and auth.uid()::text = (storage.foldername(name))[1]);
exception when duplicate_object then null; end $$;
