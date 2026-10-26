create table if not exists public.issue_dependencies (
  id uuid primary key default gen_random_uuid(),
  predecessor_id uuid not null references public.issues(id) on delete cascade,
  successor_id uuid not null references public.issues(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint issue_dependencies_no_self check (predecessor_id <> successor_id),
  constraint issue_dependencies_unique_pair unique (predecessor_id, successor_id)
);

create index if not exists issue_dependencies_successor_idx on public.issue_dependencies(successor_id);
create index if not exists issue_dependencies_predecessor_idx on public.issue_dependencies(predecessor_id);
alter table public.issue_dependencies enable row level security;

drop policy if exists "Members can read issue dependencies" on public.issue_dependencies;
create policy "Members can read issue dependencies" on public.issue_dependencies
for select to authenticated using (
  exists (select 1 from public.issues i where i.id = predecessor_id)
  and exists (select 1 from public.issues i where i.id = successor_id)
);
drop policy if exists "Members can create issue dependencies" on public.issue_dependencies;
create policy "Members can create issue dependencies" on public.issue_dependencies
for insert to authenticated with check (
  exists (select 1 from public.issues i where i.id = predecessor_id)
  and exists (select 1 from public.issues i where i.id = successor_id)
);
drop policy if exists "Members can delete issue dependencies" on public.issue_dependencies;
create policy "Members can delete issue dependencies" on public.issue_dependencies
for delete to authenticated using (
  exists (select 1 from public.issues i where i.id = predecessor_id)
  and exists (select 1 from public.issues i where i.id = successor_id)
);

create or replace function public.validate_issue_dependency()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  predecessor_project uuid;
  successor_project uuid;
  creates_cycle boolean;
begin
  if new.predecessor_id = new.successor_id then
    raise exception 'Uma tarefa não pode depender dela mesma.' using errcode = '23514';
  end if;

  select project_id into predecessor_project from public.issues where id = new.predecessor_id;
  select project_id into successor_project from public.issues where id = new.successor_id;
  if predecessor_project is null or successor_project is null or predecessor_project <> successor_project then
    raise exception 'As dependências devem ligar tarefas do mesmo projeto.' using errcode = '23514';
  end if;

  with recursive reachable(id) as (
    select successor_id from public.issue_dependencies where predecessor_id = new.successor_id
    union
    select d.successor_id
    from public.issue_dependencies d
    join reachable r on d.predecessor_id = r.id
    where not (d.predecessor_id = new.predecessor_id and d.successor_id = new.successor_id)
  )
  select exists(select 1 from reachable where id = new.predecessor_id) into creates_cycle;

  if creates_cycle then
    raise exception 'Esta dependência criaria um ciclo. Ajuste as predecessoras.' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists issue_dependencies_validate on public.issue_dependencies;
create trigger issue_dependencies_validate
before insert or update of predecessor_id, successor_id on public.issue_dependencies
for each row execute function public.validate_issue_dependency();

grant select, insert, delete on public.issue_dependencies to authenticated;
