create table if not exists public.recipes (
	id bigserial primary key,
	title text not null,
	description text not null default '',
	instructions text not null,
	difficulty text not null default 'medio' check (difficulty in ('facil', 'medio', 'dificil')),
	time_minutes integer not null default 30 check (time_minutes > 0),
	servings integer not null default 1 check (servings > 0),
	created_by text not null references public.users(username) on delete restrict,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create table if not exists public.recipe_ingredients (
	id bigserial primary key,
	recipe_id bigint not null references public.recipes(id) on delete cascade,
	product_id bigint not null references public.ingredient_catalog(id) on delete restrict,
	quantity_required numeric not null check (quantity_required > 0),
	unit text not null,
	created_at timestamptz not null default now(),
	unique (recipe_id, product_id, unit)
);

create table if not exists public.recipe_favorites (
	id bigserial primary key,
	recipe_id bigint not null references public.recipes(id) on delete cascade,
	username text not null references public.users(username) on delete cascade,
	created_at timestamptz not null default now(),
	unique (recipe_id, username)
);

create table if not exists public.recipe_ratings (
	id bigserial primary key,
	recipe_id bigint not null references public.recipes(id) on delete cascade,
	username text not null references public.users(username) on delete cascade,
	rating numeric(2,1) not null check (rating >= 0.5 and rating <= 5.0 and rating * 2 = floor(rating * 2)),
	comment text,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now(),
	unique (recipe_id, username)
);

create index if not exists recipes_created_by_idx on public.recipes(created_by);
create index if not exists recipe_ingredients_recipe_idx on public.recipe_ingredients(recipe_id);
create index if not exists recipe_ingredients_product_idx on public.recipe_ingredients(product_id);
create index if not exists recipe_favorites_username_idx on public.recipe_favorites(username);
create index if not exists recipe_favorites_recipe_idx on public.recipe_favorites(recipe_id);
create index if not exists recipe_ratings_recipe_idx on public.recipe_ratings(recipe_id);
create index if not exists recipe_ratings_username_idx on public.recipe_ratings(username);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

drop trigger if exists recipe_ratings_set_updated_at on public.recipe_ratings;
create trigger recipe_ratings_set_updated_at
before update on public.recipe_ratings
for each row execute function public.set_updated_at();

alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_favorites enable row level security;
alter table public.recipe_ratings enable row level security;

drop policy if exists recipes_service_role_all on public.recipes;
drop policy if exists recipes_public_select on public.recipes;
drop policy if exists recipes_admin_all on public.recipes;

create policy recipes_service_role_all
on public.recipes
for all
to service_role
using (true)
with check (true);

create policy recipes_public_select
on public.recipes
for select
to anon, authenticated
using (true);

create policy recipes_admin_all
on public.recipes
for all
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

drop policy if exists recipe_ingredients_service_role_all on public.recipe_ingredients;
drop policy if exists recipe_ingredients_public_select on public.recipe_ingredients;
drop policy if exists recipe_ingredients_admin_all on public.recipe_ingredients;

create policy recipe_ingredients_service_role_all
on public.recipe_ingredients
for all
to service_role
using (true)
with check (true);

create policy recipe_ingredients_public_select
on public.recipe_ingredients
for select
to anon, authenticated
using (true);

create policy recipe_ingredients_admin_all
on public.recipe_ingredients
for all
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

drop policy if exists recipe_favorites_service_role_all on public.recipe_favorites;
drop policy if exists recipe_favorites_owner_select on public.recipe_favorites;
drop policy if exists recipe_favorites_owner_insert on public.recipe_favorites;
drop policy if exists recipe_favorites_owner_delete on public.recipe_favorites;
drop policy if exists recipe_favorites_admin_all on public.recipe_favorites;

create policy recipe_favorites_service_role_all
on public.recipe_favorites
for all
to service_role
using (true)
with check (true);

create policy recipe_favorites_owner_select
on public.recipe_favorites
for select
to authenticated
using (auth.jwt() ->> 'username' = username);

create policy recipe_favorites_owner_insert
on public.recipe_favorites
for insert
to authenticated
with check (auth.jwt() ->> 'username' = username);

create policy recipe_favorites_owner_delete
on public.recipe_favorites
for delete
to authenticated
using (auth.jwt() ->> 'username' = username);

create policy recipe_favorites_admin_all
on public.recipe_favorites
for all
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

drop policy if exists recipe_ratings_service_role_all on public.recipe_ratings;
drop policy if exists recipe_ratings_public_select on public.recipe_ratings;
drop policy if exists recipe_ratings_owner_insert on public.recipe_ratings;
drop policy if exists recipe_ratings_owner_update on public.recipe_ratings;
drop policy if exists recipe_ratings_owner_delete on public.recipe_ratings;
drop policy if exists recipe_ratings_admin_all on public.recipe_ratings;

create policy recipe_ratings_service_role_all
on public.recipe_ratings
for all
to service_role
using (true)
with check (true);

create policy recipe_ratings_public_select
on public.recipe_ratings
for select
to anon, authenticated
using (true);

create policy recipe_ratings_owner_insert
on public.recipe_ratings
for insert
to authenticated
with check (auth.jwt() ->> 'username' = username);

create policy recipe_ratings_owner_update
on public.recipe_ratings
for update
to authenticated
using (auth.jwt() ->> 'username' = username)
with check (auth.jwt() ->> 'username' = username);

create policy recipe_ratings_owner_delete
on public.recipe_ratings
for delete
to authenticated
using (auth.jwt() ->> 'username' = username);

create policy recipe_ratings_admin_all
on public.recipe_ratings
for all
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
