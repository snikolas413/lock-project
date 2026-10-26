drop policy if exists "Members can read issue dependencies" on public.issue_dependencies;
create policy "Members can read issue dependencies" on public.issue_dependencies for select to authenticated using (
 exists (
  select 1 from public.issues a join public.projects p on p.id=a.project_id
  join public.workspace_members wm on wm.workspace_id=p.workspace_id
  where a.id=predecessor_id and wm.user_id=auth.uid()
 )
 and exists (
  select 1 from public.issues b join public.projects p on p.id=b.project_id
  join public.workspace_members wm on wm.workspace_id=p.workspace_id
  where b.id=successor_id and wm.user_id=auth.uid()
 )
);
drop policy if exists "Members can create issue dependencies" on public.issue_dependencies;
create policy "Members can create issue dependencies" on public.issue_dependencies for insert to authenticated with check (
 exists (
  select 1 from public.issues a join public.projects p on p.id=a.project_id
  join public.workspace_members wm on wm.workspace_id=p.workspace_id
  where a.id=predecessor_id and wm.user_id=auth.uid() and wm.role <> 'viewer'
 )
 and exists (
  select 1 from public.issues b join public.projects p on p.id=b.project_id
  join public.workspace_members wm on wm.workspace_id=p.workspace_id
  where b.id=successor_id and wm.user_id=auth.uid() and wm.role <> 'viewer'
 )
);
drop policy if exists "Members can delete issue dependencies" on public.issue_dependencies;
create policy "Members can delete issue dependencies" on public.issue_dependencies for delete to authenticated using (
 exists (
  select 1 from public.issues a join public.projects p on p.id=a.project_id
  join public.workspace_members wm on wm.workspace_id=p.workspace_id
  where a.id=predecessor_id and wm.user_id=auth.uid() and wm.role <> 'viewer'
 )
 and exists (
  select 1 from public.issues b join public.projects p on p.id=b.project_id
  join public.workspace_members wm on wm.workspace_id=p.workspace_id
  where b.id=successor_id and wm.user_id=auth.uid() and wm.role <> 'viewer'
 )
);