create extension if not exists pgcrypto;

create table if not exists public.users (
  id bigserial primary key,
  username text not null unique,
  password_hash text not null,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.ingredients (
  id bigserial primary key,
  username text not null references public.users(username) on delete cascade,
  name text not null,
  quantity numeric not null,
  unit text not null,
  created_at timestamptz not null default now()
);

create index if not exists ingredients_username_idx on public.ingredients (username);
