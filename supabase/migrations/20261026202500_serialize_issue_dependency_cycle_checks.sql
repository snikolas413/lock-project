create or replace function public.validate_issue_dependency()
returns trigger language plpgsql set search_path = public as $$
declare predecessor_project uuid; successor_project uuid; creates_cycle boolean;
begin
 perform pg_advisory_xact_lock(hashtext('public.issue_dependencies.graph'));
 if new.predecessor_id = new.successor_id then raise exception 'Uma tarefa não pode depender dela mesma.' using errcode = '23514'; end if;
 select project_id into predecessor_project from public.issues where id = new.predecessor_id;
 select project_id into successor_project from public.issues where id = new.successor_id;
 if predecessor_project is null or successor_project is null or predecessor_project <> successor_project then raise exception 'As dependências devem ligar tarefas do mesmo projeto.' using errcode = '23514'; end if;
 with recursive reachable(id) as (
  select successor_id from public.issue_dependencies where predecessor_id = new.successor_id
  union
  select d.successor_id from public.issue_dependencies d join reachable r on d.predecessor_id = r.id
 )
 select exists(select 1 from reachable where id = new.predecessor_id) into creates_cycle;
 if creates_cycle then raise exception 'Esta dependência criaria um ciclo. Ajuste as predecessoras.' using errcode = '23514'; end if;
 return new;
end; $$;