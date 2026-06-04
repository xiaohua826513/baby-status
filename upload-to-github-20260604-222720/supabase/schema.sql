create table if not exists public.couple_status (
  id boolean primary key default true,
  status_key text not null,
  status_label text not null,
  emoji text not null,
  custom_status text,
  message text,
  return_option text,
  return_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint couple_status_singleton check (id = true)
);

alter table public.couple_status enable row level security;

drop policy if exists "Public can read couple status" on public.couple_status;
create policy "Public can read couple status"
on public.couple_status
for select
to anon
using (true);

drop policy if exists "Anon cannot insert couple status" on public.couple_status;
drop policy if exists "Anon cannot update couple status" on public.couple_status;
drop policy if exists "Anon cannot delete couple status" on public.couple_status;

insert into public.couple_status (
  id,
  status_key,
  status_label,
  emoji,
  custom_status,
  message,
  return_option,
  return_at,
  updated_at
) values (
  true,
  'busy',
  '正在忙',
  '💻',
  null,
  '刚刚初始化，还没有新的留言。',
  '不确定',
  null,
  now()
) on conflict (id) do nothing;
