-- Keep ingredient images in a private bucket and secure data access via RLS.

insert into storage.buckets (
	id,
	name,
	public,
	file_size_limit,
	allowed_mime_types
)
values (
	'ingredients',
	'ingredients',
	false,
	524288,
	array['image/png']
)
on conflict (id) do update
set
	public = false,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;

alter table public.users enable row level security;
alter table public.ingredients enable row level security;
alter table public.ingredient_catalog enable row level security;

drop policy if exists users_service_role_all on public.users;
drop policy if exists users_admin_all on public.users;
drop policy if exists users_self_select on public.users;
drop policy if exists users_self_insert on public.users;
drop policy if exists users_self_update on public.users;
drop policy if exists users_self_delete on public.users;

create policy users_service_role_all
on public.users
for all
to service_role
using (true)
with check (true);

create policy users_admin_all
on public.users
for all
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

create policy users_self_select
on public.users
for select
to authenticated
using (auth.jwt() ->> 'username' = username);

create policy users_self_insert
on public.users
for insert
to authenticated
with check (auth.jwt() ->> 'username' = username);

create policy users_self_update
on public.users
for update
to authenticated
using (auth.jwt() ->> 'username' = username)
with check (auth.jwt() ->> 'username' = username);

create policy users_self_delete
on public.users
for delete
to authenticated
using (auth.jwt() ->> 'username' = username);

drop policy if exists ingredients_service_role_all on public.ingredients;
drop policy if exists ingredients_admin_all on public.ingredients;
drop policy if exists ingredients_owner_select on public.ingredients;
drop policy if exists ingredients_owner_insert on public.ingredients;
drop policy if exists ingredients_owner_update on public.ingredients;
drop policy if exists ingredients_owner_delete on public.ingredients;

create policy ingredients_service_role_all
on public.ingredients
for all
to service_role
using (true)
with check (true);

create policy ingredients_admin_all
on public.ingredients
for all
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

create policy ingredients_owner_select
on public.ingredients
for select
to authenticated
using (auth.jwt() ->> 'username' = username);

create policy ingredients_owner_insert
on public.ingredients
for insert
to authenticated
with check (auth.jwt() ->> 'username' = username);

create policy ingredients_owner_update
on public.ingredients
for update
to authenticated
using (auth.jwt() ->> 'username' = username)
with check (auth.jwt() ->> 'username' = username);

create policy ingredients_owner_delete
on public.ingredients
for delete
to authenticated
using (auth.jwt() ->> 'username' = username);

drop policy if exists ingredient_catalog_service_role_all on public.ingredient_catalog;
drop policy if exists ingredient_catalog_admin_all on public.ingredient_catalog;
drop policy if exists ingredient_catalog_public_select on public.ingredient_catalog;

create policy ingredient_catalog_service_role_all
on public.ingredient_catalog
for all
to service_role
using (true)
with check (true);

create policy ingredient_catalog_public_select
on public.ingredient_catalog
for select
to anon, authenticated
using (true);

create policy ingredient_catalog_admin_all
on public.ingredient_catalog
for all
to authenticated
using (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin')
with check (coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');

drop policy if exists ingredients_storage_service_role_all on storage.objects;
drop policy if exists ingredients_storage_admin_select on storage.objects;
drop policy if exists ingredients_storage_admin_insert on storage.objects;
drop policy if exists ingredients_storage_admin_update on storage.objects;
drop policy if exists ingredients_storage_admin_delete on storage.objects;

create policy ingredients_storage_service_role_all
on storage.objects
for all
to service_role
using (bucket_id = 'ingredients')
with check (bucket_id = 'ingredients');

create policy ingredients_storage_admin_select
on storage.objects
for select
to authenticated
using (
	bucket_id = 'ingredients'
	and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy ingredients_storage_admin_insert
on storage.objects
for insert
to authenticated
with check (
	bucket_id = 'ingredients'
	and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy ingredients_storage_admin_update
on storage.objects
for update
to authenticated
using (
	bucket_id = 'ingredients'
	and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
)
with check (
	bucket_id = 'ingredients'
	and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);

create policy ingredients_storage_admin_delete
on storage.objects
for delete
to authenticated
using (
	bucket_id = 'ingredients'
	and coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
);
