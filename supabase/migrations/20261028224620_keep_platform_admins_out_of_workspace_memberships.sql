create or replace function public.add_workspace_creator_as_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  -- Global administrators manage workspaces without becoming workspace members.
  if exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = new.created_by
  ) then
    return new;
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict (workspace_id, user_id) do update set role = 'owner';

  return new;
end;
$function$;
