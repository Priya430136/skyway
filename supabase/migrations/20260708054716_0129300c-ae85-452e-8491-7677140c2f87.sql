do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type public.app_role as enum ('admin', 'support', 'user');
  end if;
end$$;

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;

alter table public.user_roles enable row level security;

drop policy if exists "Users can read their own roles" on public.user_roles;
create policy "Users can read their own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

grant execute on function public.has_role(uuid, public.app_role) to authenticated, anon;

create table if not exists public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id text not null,
  storage_path text not null unique,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  uploader_id uuid not null references auth.users(id) on delete restrict,
  uploader_name text,
  created_at timestamptz not null default now()
);

create index if not exists ticket_attachments_ticket_id_idx
  on public.ticket_attachments (ticket_id, created_at desc);

grant select, insert, delete on public.ticket_attachments to authenticated;
grant all on public.ticket_attachments to service_role;

alter table public.ticket_attachments enable row level security;

drop policy if exists "Support can read ticket attachments" on public.ticket_attachments;
create policy "Support can read ticket attachments"
on public.ticket_attachments
for select
to authenticated
using (
  public.has_role(auth.uid(), 'support')
  or public.has_role(auth.uid(), 'admin')
  or uploader_id = auth.uid()
);

drop policy if exists "Support can upload ticket attachments" on public.ticket_attachments;
create policy "Support can upload ticket attachments"
on public.ticket_attachments
for insert
to authenticated
with check (
  uploader_id = auth.uid()
  and (
    public.has_role(auth.uid(), 'support')
    or public.has_role(auth.uid(), 'admin')
  )
);

drop policy if exists "Support can delete ticket attachments" on public.ticket_attachments;
create policy "Support can delete ticket attachments"
on public.ticket_attachments
for delete
to authenticated
using (
  public.has_role(auth.uid(), 'support')
  or public.has_role(auth.uid(), 'admin')
  or uploader_id = auth.uid()
);

drop policy if exists "ticket-attachments read" on storage.objects;
create policy "ticket-attachments read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'ticket-attachments'
  and (
    public.has_role(auth.uid(), 'support')
    or public.has_role(auth.uid(), 'admin')
    or owner = auth.uid()
  )
);

drop policy if exists "ticket-attachments write" on storage.objects;
create policy "ticket-attachments write"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'ticket-attachments'
  and (
    public.has_role(auth.uid(), 'support')
    or public.has_role(auth.uid(), 'admin')
  )
);

drop policy if exists "ticket-attachments delete" on storage.objects;
create policy "ticket-attachments delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'ticket-attachments'
  and (
    public.has_role(auth.uid(), 'support')
    or public.has_role(auth.uid(), 'admin')
    or owner = auth.uid()
  )
);