-- Canonical KoperasiHub schema for Supabase/PostgreSQL.

begin;

create extension if not exists pgcrypto with schema extensions;

-- Stores the SIMKOPDES institutional snapshot consumed by the application.
create table public.cooperatives (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  desa text,
  kecamatan text,
  kabupaten text not null,
  provinsi text not null,
  jumlah_anggota integer check (jumlah_anggota is null or jumlah_anggota >= 0),
  nib text,
  npwp text,
  berbadan_hukum boolean not null default true,
  punya_akun boolean not null default true,
  status_rat text check (
    status_rat in ('belum', 'melaksanakan', 'dilaporkan', 'diverifikasi')
  ),
  simpanan_pokok bigint check (simpanan_pokok is null or simpanan_pokok >= 0),
  simpanan_wajib bigint check (simpanan_wajib is null or simpanan_wajib >= 0),
  volume_transaksi bigint not null default 0 check (volume_transaksi >= 0),
  nilai_transaksi bigint not null default 0 check (nilai_transaksi >= 0),
  pembangunan_gerai_pct integer not null default 100 check (
    pembangunan_gerai_pct between 0 and 100
  ),
  simkopdes_verified boolean not null default true,
  reputation_score integer not null default 80 check (
    reputation_score between 0 and 100
  ),
  is_producer boolean not null default false
);

-- Maps application profiles one-to-one with Supabase Auth users.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  cooperative_id uuid references public.cooperatives (id) on delete set null,
  role text not null check (role in ('koperasi', 'admin')),
  display_name text,
  constraint users_role_cooperative_check check (
    (role = 'koperasi' and cooperative_id is not null)
    or role = 'admin'
  )
);

create table public.commodities (
  id text primary key,
  nama text not null,
  satuan text not null check (satuan in ('kg', 'liter'))
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  nama text not null,
  tipe text not null check (tipe in ('distributor', 'bumn', 'koperasi')),
  cooperative_id uuid references public.cooperatives (id) on delete set null,
  lokasi text,
  constraint suppliers_type_cooperative_check check (
    (tipe = 'koperasi' and cooperative_id is not null)
    or (tipe in ('distributor', 'bumn') and cooperative_id is null)
  )
);

create table public.price_tiers (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid not null references public.suppliers (id) on delete cascade,
  commodity_id text not null references public.commodities (id) on delete restrict,
  nama_tier text not null,
  min_volume integer not null check (min_volume > 0),
  harga_per_unit integer not null check (harga_per_unit > 0),
  unique (supplier_id, commodity_id, min_volume)
);

create table public.pools (
  id uuid primary key default gen_random_uuid(),
  commodity_id text not null references public.commodities (id) on delete restrict,
  wilayah text not null,
  window_start date not null,
  window_end date not null,
  status text not null default 'open' check (
    status in ('open', 'locked', 'po_issued')
  ),
  selected_tier_id uuid references public.price_tiers (id) on delete restrict,
  po_number text unique,
  constraint pools_window_check check (window_end >= window_start),
  constraint pools_status_fields_check check (
    (status = 'open' and selected_tier_id is null and po_number is null)
    or (status = 'locked' and selected_tier_id is not null and po_number is null)
    or (status = 'po_issued' and selected_tier_id is not null and po_number is not null)
  ),
  unique (commodity_id, wilayah, window_start, window_end)
);

create table public.demands (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  cooperative_id uuid not null references public.cooperatives (id) on delete cascade,
  role text not null check (role in ('demand', 'supply')),
  volume integer not null check (volume > 0),
  harga_baseline integer check (harga_baseline is null or harga_baseline > 0),
  harga_penawaran integer check (harga_penawaran is null or harga_penawaran > 0),
  created_at timestamptz not null default now(),
  constraint demands_role_price_check check (
    (role = 'demand' and harga_baseline is not null and harga_penawaran is null)
    or (role = 'supply' and harga_penawaran is not null and harga_baseline is null)
  )
);

-- Stores issued PO allocations. Pool totals are derived from demand rows to avoid
-- duplicating aggregate state in the pools table.
create table public.allocations (
  id uuid primary key default gen_random_uuid(),
  pool_id uuid not null references public.pools (id) on delete cascade,
  cooperative_id uuid not null references public.cooperatives (id) on delete cascade,
  volume integer not null check (volume > 0),
  harga_tier integer not null check (harga_tier > 0),
  hemat_rp integer not null check (hemat_rp >= 0),
  fee_rp integer not null default 0 check (fee_rp >= 0 and fee_rp <= hemat_rp),
  unique (pool_id, cooperative_id)
);

-- Stores bilateral invoices; the net settlement amount is derived at read time.
create table public.settlements (
  id uuid primary key default gen_random_uuid(),
  coop_a uuid not null references public.cooperatives (id) on delete cascade,
  coop_b uuid not null references public.cooperatives (id) on delete cascade,
  tagihan_a_ke_b bigint not null check (tagihan_a_ke_b >= 0),
  tagihan_b_ke_a bigint not null check (tagihan_b_ke_a >= 0),
  constraint settlements_distinct_cooperatives_check check (coop_a <> coop_b),
  unique (coop_a, coop_b)
);

create index users_cooperative_id_idx on public.users (cooperative_id);
create index suppliers_cooperative_id_idx on public.suppliers (cooperative_id);
create index price_tiers_lookup_idx on public.price_tiers (
  commodity_id,
  min_volume,
  harga_per_unit
);
create index pools_lookup_idx on public.pools (
  commodity_id,
  wilayah,
  window_start,
  window_end,
  status
);
create index demands_pool_role_idx on public.demands (pool_id, role);
create index demands_cooperative_id_idx on public.demands (cooperative_id);
create index allocations_cooperative_id_idx on public.allocations (cooperative_id);
create index settlements_coop_b_idx on public.settlements (coop_b);

-- SECURITY DEFINER helpers prevent recursive policy evaluation on public.users.
create or replace function public.current_cooperative_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select app_user.cooperative_id
  from public.users as app_user
  where app_user.id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select app_user.role = 'admin'
      from public.users as app_user
      where app_user.id = auth.uid()
    ),
    false
  )
$$;

-- Exposes pool progress without revealing participant identities or baseline prices
-- hidden by tenant-level demand policies.
create or replace function public.get_pool_stats()
returns table (
  pool_id uuid,
  total_volume bigint,
  participant_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    pool.id as pool_id,
    coalesce(sum(demand.volume) filter (where demand.role = 'demand'), 0)::bigint
      as total_volume,
    count(distinct demand.cooperative_id) filter (where demand.role = 'demand')
      as participant_count
  from public.pools as pool
  left join public.demands as demand on demand.pool_id = pool.id
  where auth.uid() is not null
  group by pool.id
$$;

-- Exposes allocation totals without revealing participant-level rows protected by RLS.
create or replace function public.get_allocation_stats()
returns table (
  pool_id uuid,
  total_volume bigint,
  total_savings bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    allocation.pool_id,
    coalesce(sum(allocation.volume), 0)::bigint as total_volume,
    coalesce(sum(allocation.hemat_rp), 0)::bigint as total_savings
  from public.allocations as allocation
  where auth.uid() is not null
  group by allocation.pool_id
$$;

revoke all on function public.current_cooperative_id() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.get_pool_stats() from public;
revoke all on function public.get_allocation_stats() from public;
grant execute on function public.current_cooperative_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.get_pool_stats() to authenticated;
grant execute on function public.get_allocation_stats() to authenticated;

alter table public.cooperatives enable row level security;
alter table public.users enable row level security;
alter table public.commodities enable row level security;
alter table public.suppliers enable row level security;
alter table public.price_tiers enable row level security;
alter table public.pools enable row level security;
alter table public.demands enable row level security;
alter table public.allocations enable row level security;
alter table public.settlements enable row level security;

create policy "Authenticated users can read cooperatives"
on public.cooperatives for select
to authenticated
using (true);

create policy "Users can read their profile and admins can read all profiles"
on public.users for select
to authenticated
using (id = auth.uid() or (select public.is_admin()));

create policy "Authenticated users can read commodities"
on public.commodities for select
to authenticated
using (true);

create policy "Authenticated users can read suppliers"
on public.suppliers for select
to authenticated
using (true);

create policy "Authenticated users can read price tiers"
on public.price_tiers for select
to authenticated
using (true);

create policy "Authenticated users can read pools"
on public.pools for select
to authenticated
using (true);

create policy "Cooperatives can create open pools"
on public.pools for insert
to authenticated
with check (
  (select public.current_cooperative_id()) is not null
  and status = 'open'
  and selected_tier_id is null
  and po_number is null
);

create policy "Admins can manage pools"
on public.pools for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Cooperatives can read their demands and admins can read all demands"
on public.demands for select
to authenticated
using (
  cooperative_id = (select public.current_cooperative_id())
  or (select public.is_admin())
);

create policy "Cooperatives can create their demands"
on public.demands for insert
to authenticated
with check (
  cooperative_id = (select public.current_cooperative_id())
  or (select public.is_admin())
);

create policy "Cooperatives can update their demands and admins can update all demands"
on public.demands for update
to authenticated
using (
  cooperative_id = (select public.current_cooperative_id())
  or (select public.is_admin())
)
with check (
  cooperative_id = (select public.current_cooperative_id())
  or (select public.is_admin())
);

create policy "Cooperatives can delete their demands and admins can delete all demands"
on public.demands for delete
to authenticated
using (
  cooperative_id = (select public.current_cooperative_id())
  or (select public.is_admin())
);

create policy "Cooperatives can read their allocations and admins can read all allocations"
on public.allocations for select
to authenticated
using (
  cooperative_id = (select public.current_cooperative_id())
  or (select public.is_admin())
);

create policy "Admins can manage allocations"
on public.allocations for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy "Settlement participants and admins can read settlements"
on public.settlements for select
to authenticated
using (
  (select public.current_cooperative_id()) in (coop_a, coop_b)
  or (select public.is_admin())
);

create policy "Admins can manage settlements"
on public.settlements for all
to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

-- Restrict Data API privileges; RLS remains authoritative for authenticated requests.
revoke all on table
  public.cooperatives,
  public.users,
  public.commodities,
  public.suppliers,
  public.price_tiers,
  public.pools,
  public.demands,
  public.allocations,
  public.settlements
from anon;

grant select on table
  public.cooperatives,
  public.users,
  public.commodities,
  public.suppliers,
  public.price_tiers,
  public.pools,
  public.demands,
  public.allocations,
  public.settlements
to authenticated;

grant insert on table public.pools, public.demands to authenticated;
grant update, delete on table public.pools, public.demands to authenticated;
grant insert, update, delete on table public.allocations, public.settlements
to authenticated;

grant all on table
  public.cooperatives,
  public.users,
  public.commodities,
  public.suppliers,
  public.price_tiers,
  public.pools,
  public.demands,
  public.allocations,
  public.settlements
to service_role;

grant execute on function public.current_cooperative_id() to service_role;
grant execute on function public.is_admin() to service_role;
grant execute on function public.get_pool_stats() to service_role;
grant execute on function public.get_allocation_stats() to service_role;

commit;
