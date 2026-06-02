-- AutoShake application tables
-- Apply via: Supabase Dashboard > SQL Editor, or `supabase db push`
--
-- Depends on: auth.users (managed by Supabase Auth)

-- -----------------------------------------------------------------------
-- profiles
-- One row per user. Created on signup, last_seen_at updated on login.
-- -----------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  created_at   timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);


-- -----------------------------------------------------------------------
-- resumes
-- Tracks each resume a user has uploaded (PDF stored in the 'resumes' bucket).
-- -----------------------------------------------------------------------
create table if not exists public.resumes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  filename     text not null,
  storage_path text not null,              -- {user_id}/{filename} in the 'resumes' bucket
  url          text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.resumes enable row level security;

create policy "Users can read their own resumes"
  on public.resumes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own resumes"
  on public.resumes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own resumes"
  on public.resumes for delete
  using (auth.uid() = user_id);


-- -----------------------------------------------------------------------
-- tailored_resumes
-- Records each generated tailored resume PDF for audit / history.
-- -----------------------------------------------------------------------
create table if not exists public.tailored_resumes (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  source_resume_id  uuid references public.resumes(id) on delete set null,
  job_description   text not null,
  storage_path      text,                  -- path in the 'resumes' bucket once saved
  url               text,
  created_at        timestamptz not null default now()
);

alter table public.tailored_resumes enable row level security;

create policy "Users can read their own tailored resumes"
  on public.tailored_resumes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tailored resumes"
  on public.tailored_resumes for insert
  with check (auth.uid() = user_id);
