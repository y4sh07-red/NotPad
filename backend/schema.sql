-- Run this script in your Supabase SQL Editor:
create table if not exists public.notes (
  id text primary key,
  title text default '',
  content text default '',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.notes enable row level security;

-- Drop policy if it already exists to prevent duplicate policy errors
drop policy if exists "Allow all actions on notes" on public.notes;

-- Allow read/insert/update/delete with key
create policy "Allow all actions on notes" on public.notes
  for all using (true) with check (true);
