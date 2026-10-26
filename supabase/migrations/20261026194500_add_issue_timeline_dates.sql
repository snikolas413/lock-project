alter table public.issues
  add column if not exists start_date date,
  add column if not exists end_date date;

-- Keep legacy due dates intact and seed the new end date from them.
update public.issues
set end_date = due_date
where end_date is null and due_date is not null;

alter table public.issues
  drop constraint if exists issues_timeline_date_order;

alter table public.issues
  add constraint issues_timeline_date_order
  check (start_date is null or end_date is null or start_date <= end_date);
