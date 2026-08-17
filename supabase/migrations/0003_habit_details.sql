-- Micro Habit: extend schema to support the full "1%習慣" UI
-- (categories, trigger sentences, time-of-day, unit, bonus reps per log)

-- 1. Categories: 4 built-in + user-created custom ones.
create table if not exists public.categories (
  id text primary key, -- 'work' | 'health' | 'mind' | 'life' | 'cat-<uuid>'
  user_id uuid references auth.users (id) on delete cascade, -- null for built-ins
  label text not null,
  color text not null,
  is_builtin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

drop policy if exists "Anyone can read builtin categories" on public.categories;
create policy "Anyone can read builtin categories"
  on public.categories for select
  using (is_builtin = true);

drop policy if exists "Users manage their own categories" on public.categories;
create policy "Users manage their own categories"
  on public.categories for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and is_builtin = false);

insert into public.categories (id, user_id, label, color, is_builtin) values
  ('work',   null, '工作與學習', '#5468C4', true),
  ('health', null, '健康與運動', '#3C8452', true),
  ('mind',   null, '心靈與情緒', '#E0A428', true),
  ('life',   null, '生活與理財', '#C1567A', true)
on conflict (id) do nothing;

-- 2. Extend habits with the fields the UI needs.
alter table public.habits
  add column if not exists category_id text references public.categories (id) on delete set null,
  add column if not exists trigger_phrase text,
  add column if not exists time_of_day time,
  add column if not exists unit text default '次',
  add column if not exists floor_target integer not null default 1,
  add column if not exists sort_order integer not null default 0,
  add column if not exists archived_at timestamptz;

-- 'emoji' from 0001 becomes the stamp character shown on the stamp mark.
comment on column public.habits.emoji is 'Single character shown on the stamp mark (defaults to first char of name).';

-- 3. Extend habit_logs with bonus reps (extra completions beyond the daily floor).
alter table public.habit_logs
  add column if not exists bonus_count integer not null default 0;

-- 4. Helpful index for category lookups.
create index if not exists habits_category_id_idx on public.habits (category_id);
create index if not exists categories_user_id_idx on public.categories (user_id);
