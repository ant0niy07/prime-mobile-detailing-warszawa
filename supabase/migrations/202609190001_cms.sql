-- Run in the project's SQL editor as the database owner. Safe to re-run.
create table if not exists public.prime_editors (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.prime_editors enable row level security;
revoke all on public.prime_editors from anon, authenticated;

create or replace function public.is_prime_editor() returns boolean
language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.prime_editors where user_id = (select auth.uid())); $$;
revoke all on function public.is_prime_editor() from public;
grant execute on function public.is_prime_editor() to anon, authenticated;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  translation_group uuid not null default gen_random_uuid(),
  locale text not null check (locale in ('pl','en','ru')),
  title text not null check (char_length(title) between 3 and 180),
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 150),
  excerpt text not null check (char_length(excerpt) between 10 and 500),
  content jsonb not null default '[]' check (jsonb_typeof(content) = 'array' and jsonb_array_length(content) between 1 and 150),
  cover_image text not null default '', cover_alt text not null default '',
  author text not null check (char_length(author) between 2 and 150),
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  seo_title text not null, seo_description text not null, og_image text not null default '',
  constraint published_requires_date check (status <> 'published' or published_at is not null),
  unique (locale, slug), unique (translation_group, locale)
);
create index if not exists posts_publication on public.posts(locale,status,published_at desc);
alter table public.posts enable row level security;
revoke all on public.posts from anon, authenticated;
grant select on public.posts to anon;
grant select,insert,update,delete on public.posts to authenticated;
drop policy if exists "Published articles only" on public.posts;
create policy "Published articles only" on public.posts for select to anon,authenticated
  using (status='published' and published_at<=now());
drop policy if exists "Editors manage posts" on public.posts;
create policy "Editors manage posts" on public.posts for all to authenticated
  using ((select public.is_prime_editor())) with check ((select public.is_prime_editor()));

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('blog-images','blog-images',true,8388608,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=8388608,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists "Editors upload article images" on storage.objects;
create policy "Editors upload article images" on storage.objects for insert to authenticated
  with check (bucket_id='blog-images' and (select public.is_prime_editor()));
drop policy if exists "Editors manage article images" on storage.objects;
create policy "Editors manage article images" on storage.objects for select to authenticated
  using (bucket_id='blog-images' and (select public.is_prime_editor()));
drop policy if exists "Editors delete article images" on storage.objects;
create policy "Editors delete article images" on storage.objects for delete to authenticated
  using (bucket_id='blog-images' and (select public.is_prime_editor()));
-- No public form submissions, public writes, signup-based editor grants or service keys.
