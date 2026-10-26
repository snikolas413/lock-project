create or replace function public.add_workspace_creator_as_owner()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (workspace_id, user_id) do nothing;
  return new;
end;
$$;

create trigger workspace_creator_membership
after insert on public.workspaces
for each row execute function public.add_workspace_creator_as_owner();
