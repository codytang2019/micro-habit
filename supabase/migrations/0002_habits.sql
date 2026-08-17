-- Micro Habit: habit tracking tables (per-user, RLS-protected)

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  emoji text,
  created_at timestamptz not null default now()
);

alter table public.habits enable row level security;

drop policy if exists "Users manage their own habits" on public.habits;
create policy "Users manage their own habits"
  on public.habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  completed_on date not null default current_date,
  created_at timestamptz not null default now(),
  unique (habit_id, completed_on)
);

alter table public.habit_logs enable row level security;

drop policy if exists "Users manage their own habit logs" on public.habit_logs;
create policy "Users manage their own habit logs"
  on public.habit_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists habits_user_id_idx on public.habits (user_id);
create index if not exists habit_logs_user_id_idx on public.habit_logs (user_id);
create index if not exists habit_logs_habit_id_idx on public.habit_logs (habit_id);
