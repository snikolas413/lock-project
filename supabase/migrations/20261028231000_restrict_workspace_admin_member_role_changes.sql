drop policy if exists "Workspace admins can remove members" on public.workspace_members;
create policy "Workspace admins can remove members"
on public.workspace_members
for delete
to authenticated
using (
  public.is_platform_admin()
  or (
    public.can_manage_workspace(workspace_id)
    and role <> 'owner'
  )
);

drop policy if exists "Workspace admins can update members" on public.workspace_members;
create policy "Workspace admins can update members"
on public.workspace_members
for update
to authenticated
using (
  public.is_platform_admin()
  or (
    public.can_manage_workspace(workspace_id)
    and role <> 'owner'
  )
)
with check (
  public.is_platform_admin()
  or (
    public.can_manage_workspace(workspace_id)
    and role in ('analyst', 'member', 'viewer')
  )
);