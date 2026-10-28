import React, { FormEvent, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import './styles.css';
import { AdminUsersSection, type AdminUser } from './components/AdminUsersSection';
import { OverviewInsights } from './components/OverviewInsights';

type Workspace = { id: string; name: string; slug: string; created_at: string };
type Client = { id: string; workspace_id: string; name: string; slug: string; description: string | null; status: string; created_at: string };
type Project = { id: string; name: string; key: string; description: string | null; status: string; workspace_id: string; client_id: string; updated_at: string };
type Issue = { id: string; title: string; description: string | null; issue_number: number; type: string; parent_issue_id: string | null; status: string; priority: string; updated_at: string; project_id: string; due_date: string | null; start_date: string | null; end_date: string | null; duration_days: number | null; assignee_id: string | null };
type TeamMember = { workspace_id: string; user_id: string; role: string };
type Profile = { id: string; display_name: string | null };
type IssueComment = { id: string; issue_id: string; author_id: string; body: string; created_at: string };
type Label = { id: string; project_id: string; name: string; color: string; created_at: string };
type IssueLabel = { issue_id: string; label_id: string };
type IssueDependency = { id: string; predecessor_id: string; successor_id: string; created_at: string };

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientDescription, setClientDescription] = useState('');
  const [projectClient, setProjectClient] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskType, setTaskType] = useState('task');
  const [taskParentIssue, setTaskParentIssue] = useState('');
  const [issueSearch, setIssueSearch] = useState('');
  const [issueProjectFilter, setIssueProjectFilter] = useState('all');
  const [issueClientFilter, setIssueClientFilter] = useState('all');
  const [issueStatusFilter, setIssueStatusFilter] = useState('all');
  const [issuePriorityFilter, setIssuePriorityFilter] = useState('all');
  const [issueSort, setIssueSort] = useState<'updated' | 'priority' | 'due_date'>('updated');
  const [taskView, setTaskView] = useState<'list' | 'kanban' | 'hierarchy' | 'timeline' | 'roadmap'>('kanban');
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [draggingIssueId, setDraggingIssueId] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [issueComments, setIssueComments] = useState<IssueComment[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [taskProject, setTaskProject] = useState('');
  const [taskStatus, setTaskStatus] = useState('backlog');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskEndDate, setTaskEndDate] = useState('');
  const [timelineScale, setTimelineScale] = useState<'week' | 'month'>('week');
  const [scheduleStartDate, setScheduleStartDate] = useState(new Date().toISOString().slice(0,10));
  const [taskAssignee, setTaskAssignee] = useState('');
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [teamClientsWorkspace, setTeamClientsWorkspace] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [projectSection, setProjectSection] = useState<'summary' | 'tasks' | 'hierarchy' | 'timeline' | 'roadmap'>('tasks');
  const [activePage, setActivePage] = useState<'overview' | 'projects' | 'tasks' | 'clients' | 'admin' | 'users'>('overview');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [memberEmailDrafts, setMemberEmailDrafts] = useState<Record<string, string>>({});
  const [memberRoleDrafts, setMemberRoleDrafts] = useState<Record<string, 'owner' | 'admin' | 'analyst' | 'member' | 'viewer'>>({});
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [issueLabels, setIssueLabels] = useState<IssueLabel[]>([]);
  const [issueDependencies, setIssueDependencies] = useState<IssueDependency[]>([]);
  const [dependencyDrafts, setDependencyDrafts] = useState<Record<string, string>>({});
  const [issueLabelFilter, setIssueLabelFilter] = useState('all');
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('#c6f08b');
  const [labelProject, setLabelProject] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try { return localStorage.getItem('lock-project-theme') === 'light' ? 'light' : 'dark'; }
    catch { return 'dark'; }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('lock-project-theme', theme); } catch { /* storage may be unavailable */ }
  }, [theme]);

  useEffect(() => {
    if (!isSupabaseConfigured) { setReady(true); return; }
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setError(error.message);
      setSession(data.session); setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) { setWorkspaces([]); setClients([]); setProjects([]); setIssues([]); setTeamMembers([]); setProfiles([]); setIssueDependencies([]); setIsPlatformAdmin(false); return; }
    void (async () => {
      const { data, error } = await (supabase as any).rpc('is_platform_admin');
      if (error) setError(error.message);
      setIsPlatformAdmin(data === true);
      await loadWorkspaces();
    })();
  }, [session]);

  async function loadAdminUsers() {
    if (!isPlatformAdmin) return;
    setAdminUsersLoading(true); setError('');
    const { data, error } = await supabase.functions.invoke('admin-user-management', { body: {} });
    if (error) {
      let detail = error.message || 'Não foi possível carregar os usuários.';
      try { const payload = await error.context?.json(); if (payload?.error) detail = payload.error; } catch { /* resposta sem JSON */ }
      setError(detail);
    } else if (data?.error) setError(data.error);
    else setAdminUsers((data?.users ?? []) as AdminUser[]);
    setAdminUsersLoading(false);
  }

  useEffect(() => {
    if (session && isPlatformAdmin && activePage === 'users') void loadAdminUsers();
  }, [session, isPlatformAdmin, activePage]);

  async function loadWorkspaces() {
    const { data, error } = await supabase.from('workspaces').select('id,name,slug,created_at').order('created_at', { ascending: false });
    if (error) { setError(error.message); return; }
    const nextWorkspaces = (data ?? []) as Workspace[];
    setWorkspaces(nextWorkspaces);
    setSelectedWorkspace(current => current && nextWorkspaces.some(w => w.id === current) ? current : (nextWorkspaces[0]?.id ?? ''));
    if (!nextWorkspaces.length) { setClients([]); setProjects([]); setIssues([]); setTeamMembers([]); setProfiles([]); return; }
    const { data: clientData, error: clientError } = await (supabase as any).from('clients').select('id,workspace_id,name,slug,description,status,created_at').in('workspace_id', nextWorkspaces.map(w => w.id)).order('name');
    if (clientError) { setError(clientError.message); return; }
    const nextClients = (clientData ?? []) as Client[];
    setClients(nextClients);
    setProjectClient(current => current && nextClients.some(client => client.id === current) ? current : (nextClients.find(client => client.workspace_id === (selectedWorkspace || nextWorkspaces[0]?.id))?.id ?? ''));
    const { data: memberData, error: memberError } = await supabase.from('workspace_members').select('workspace_id,user_id,role').in('workspace_id', nextWorkspaces.map(w => w.id));
    if (memberError) setError(memberError.message);
    const nextMembers = (memberData ?? []) as TeamMember[];
    setTeamMembers(nextMembers);
    const memberIds = [...new Set(nextMembers.map(member => member.user_id))];
    if (memberIds.length) {
      const { data: profileData, error: profileError } = await supabase.from('profiles').select('id,display_name').in('id', memberIds);
      if (profileError) setError(profileError.message);
      else setProfiles((profileData ?? []) as Profile[]);
    } else setProfiles([]);
    const { data: projectData, error: projectError } = await (supabase as any).from('projects').select('id,name,key,description,status,workspace_id,client_id,updated_at').in('workspace_id', nextWorkspaces.map(w => w.id)).order('updated_at', { ascending: false });
    if (projectError) { setError(projectError.message); return; }
    const nextProjects = (projectData ?? []) as Project[];
    setProjects(nextProjects);
    if (!nextProjects.length) { setIssues([]); setLabels([]); setIssueLabels([]); setIssueDependencies([]); return; }
    const { data: issueData, error: issueError } = await supabase.from('issues').select('id,title,description,issue_number,type,parent_issue_id,status,priority,updated_at,project_id,due_date,start_date,end_date,duration_days,assignee_id').in('project_id', nextProjects.map(p => p.id)).order('updated_at', { ascending: false });
    if (issueError) setError(issueError.message);
    else {
      const nextIssues = (issueData ?? []) as Issue[];
      setIssues(nextIssues);
      if (nextIssues.length) {
        const { data: relationData, error: relationError } = await supabase.from('issue_labels').select('issue_id,label_id').in('issue_id', nextIssues.map(i => i.id));
        if (relationError) setError(relationError.message);
        else setIssueLabels((relationData ?? []) as IssueLabel[]);
      } else setIssueLabels([]);
    }
    const { data: dependencyData, error: dependencyError } = await (supabase as any).from('issue_dependencies').select('id,predecessor_id,successor_id,created_at');
    if (dependencyError) setError(dependencyError.message);
    else setIssueDependencies((dependencyData ?? []) as IssueDependency[]);
    const { data: labelData, error: labelError } = await supabase.from('labels').select('id,project_id,name,color,created_at').in('project_id', nextProjects.map(p => p.id)).order('name');
    if (labelError) setError(labelError.message);
    else setLabels((labelData ?? []) as Label[]);
  }

  useEffect(() => {
    if (!selectedIssue || !session) { setIssueComments([]); return; }
    let active = true;
    setCommentsLoading(true);
    supabase.from('issue_comments').select('id,issue_id,author_id,body,created_at').eq('issue_id', selectedIssue.id).order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else setIssueComments((data ?? []) as IssueComment[]);
        setCommentsLoading(false);
      });
    return () => { active = false; };
  }, [selectedIssue?.id, session]);

  async function addIssueComment(event: FormEvent) {
    event.preventDefault();
    if (!session?.user || !selectedIssue || !commentDraft.trim()) return;
    setBusy(true); setError('');
    const { error } = await supabase.from('issue_comments').insert({ issue_id: selectedIssue.id, author_id: session.user.id, body: commentDraft.trim() });
    if (error) setError(error.message);
    else {
      setCommentDraft('');
      const { data, error: loadError } = await supabase.from('issue_comments').select('id,issue_id,author_id,body,created_at').eq('issue_id', selectedIssue.id).order('created_at', { ascending: true });
      if (loadError) setError(loadError.message);
      else setIssueComments((data ?? []) as IssueComment[]);
      setMessage('Comentário adicionado.');
    }
    setBusy(false);
  }

  async function authenticate(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName.trim() } } });
        if (error) throw error;
        setMessage(data.session ? 'Conta criada com sucesso.' : 'Cadastro recebido! Confira seu e-mail para confirmar a conta.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível autenticar.'); }
    finally { setBusy(false); }
  }

  async function addWorkspaceMember(workspaceId: string) {
    const memberEmail = (memberEmailDrafts[workspaceId] || '').trim().toLowerCase();
    const memberRole = memberRoleDrafts[workspaceId] || 'analyst';
    if (!memberEmail) { setError('Informe o e-mail da pessoa que deseja convidar.'); return; }
    setBusy(true); setError(''); setMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('invite-workspace-member', { body: { workspace_id: workspaceId, email: memberEmail, role: memberRole } });
      if (error) {
        let detail = error.message || 'Não foi possível enviar o convite.';
        try { const payload = await error.context?.json(); if (payload?.error) detail = payload.error; } catch { /* resposta sem JSON */ }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      setMemberEmailDrafts(current => ({ ...current, [workspaceId]: '' }));
      setMessage(data?.status === 'invited' ? 'Convite enviado para ' + memberEmail + '. A pessoa receberá um e-mail para ativar a conta e entrar no time.' : memberEmail + ' já tinha uma conta e foi adicionada ao time.');
      await loadWorkspaces();
    } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir o convite.'); }
    finally { setBusy(false); }
  }

  async function updateMemberRole(member: TeamMember, role: string) {
    if (!['owner', 'admin', 'analyst', 'member', 'viewer'].includes(role) || member.role === role) return;
    const owners = teamMembers.filter(item => item.workspace_id === member.workspace_id && item.role === 'owner');
    if (member.role === 'owner' && role !== 'owner' && owners.length <= 1) {
      setError('O time precisa manter pelo menos um proprietário.');
      return;
    }
    setBusy(true); setError(''); setMessage('');
    const { error } = await supabase.from('workspace_members').update({ role }).eq('workspace_id', member.workspace_id).eq('user_id', member.user_id);
    if (error) setError(error.message);
    else { setMessage('Permissão do membro atualizada.'); await loadWorkspaces(); }
    setBusy(false);
  }

  async function removeMember(member: TeamMember) {
    if (member.user_id === session?.user.id) {
      setError('Para evitar bloquear o acesso ao time, não é possível remover sua própria conta por aqui.');
      return;
    }
    const owners = teamMembers.filter(item => item.workspace_id === member.workspace_id && item.role === 'owner');
    if (member.role === 'owner' && owners.length <= 1) {
      setError('O time precisa manter pelo menos um proprietário.');
      return;
    }
    const displayName = profiles.find(profile => profile.id === member.user_id)?.display_name || member.user_id.slice(0, 8);
    if (!window.confirm(`Remover ${displayName} deste time? A pessoa perderá acesso aos projetos deste workspace.`)) return;
    setBusy(true); setError(''); setMessage('');
    const { error } = await supabase.from('workspace_members').delete().eq('workspace_id', member.workspace_id).eq('user_id', member.user_id);
    if (error) setError(error.message);
    else { setMessage('Membro removido do time.'); await loadWorkspaces(); }
    setBusy(false);
  }

  async function createWorkspace(event: FormEvent) {
    event.preventDefault(); if (!session?.user) return;
    const name = workspaceName.trim(); if (!name) return;
    const slug = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'workspace';
    setBusy(true); setError(''); setMessage('');
    const { error } = await supabase.from('workspaces').insert({ name, slug, created_by: session.user.id });
    if (error) setError(error.message);
    else { setWorkspaceName(''); setMessage('Time criado com sucesso.'); await loadWorkspaces(); }
    setBusy(false);
  }

  async function createClient(event: FormEvent) {
    event.preventDefault();
    if (!session?.user || !selectedWorkspace || !clientName.trim()) return;
    const name = clientName.trim();
    const slugBase = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'cliente';
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;
    setBusy(true); setError(''); setMessage('');
    const { data, error } = await (supabase as any).from('clients').insert({ workspace_id: selectedWorkspace, name, slug, description: clientDescription.trim() || null, created_by: session.user.id }).select('id').single();
    if (error) setError(error.message);
    else { setClientName(''); setClientDescription(''); if (data?.id) setProjectClient(data.id); setMessage('Cliente criado. Agora você pode vincular vários projetos a ele.'); await loadWorkspaces(); }
    setBusy(false);
  }

  async function saveIssue(event: FormEvent) {
    event.preventDefault();
    const projectId = taskProject || projects[0]?.id;
    if (!session?.user || !projectId || !taskTitle.trim()) return;
    setBusy(true); setError(''); setMessage('');
    const payload = {
      title: taskTitle.trim(),
      description: taskDescription.trim() || null,
      type: taskType,
      parent_issue_id: taskParentIssue || null,
      project_id: projectId,
      status: taskStatus,
      priority: taskPriority,
      due_date: taskDueDate || taskEndDate || null,
      start_date: taskStartDate || null,
      end_date: taskEndDate || taskDueDate || null,
      duration_days: 1,
      assignee_id: taskAssignee || null,
    };
    const result = editingIssueId
      ? await supabase.from('issues').update(payload).eq('id', editingIssueId)
      : await supabase.from('issues').insert({ ...payload, reporter_id: session.user.id });
    if (result.error) setError(result.error.message);
    else {
      setTaskTitle(''); setTaskDescription(''); setTaskType('task'); setTaskParentIssue(''); setTaskDueDate(''); setTaskStartDate(''); setTaskEndDate(''); setTaskAssignee(''); setTaskStatus('backlog'); setTaskPriority('medium');
      setEditingIssueId(null); setQuickCreateOpen(false); setMessage(editingIssueId ? 'Tarefa atualizada.' : 'Tarefa criada com sucesso.');
      await loadWorkspaces();
    }
    setBusy(false);
  }

  function startEditingIssue(issue: Issue) {
    setEditingIssueId(issue.id);
    setQuickCreateOpen(true);
    setTaskTitle(issue.title);
    setTaskDescription(issue.description ?? '');
    setTaskType(issue.type ?? 'task');
    setTaskParentIssue(issue.parent_issue_id ?? '');
    setTaskProject(issue.project_id);
    setTaskStatus(issue.status);
    setTaskPriority(issue.priority);
    setTaskDueDate(issue.due_date ?? '');
    setTaskStartDate(issue.start_date ?? '');
    setTaskEndDate(issue.end_date ?? issue.due_date ?? '');
    setTaskAssignee(issue.assignee_id ?? '');
    setError(''); setMessage('');
    // A edição é exibida em uma janela modal; não deslocamos a página.
  }

  const filteredIssues = issues.filter(issue => {
    const q = issueSearch.trim().toLowerCase();
    return (!q || issue.title.toLowerCase().includes(q) || (issue.description ?? '').toLowerCase().includes(q) || `${projects.find(p => p.id === issue.project_id)?.key ?? ''}-${issue.issue_number}`.toLowerCase().includes(q))
      && (issueProjectFilter === 'all' || issue.project_id === issueProjectFilter)
      && (issueClientFilter === 'all' || projects.some(project => project.id === issue.project_id && project.client_id === issueClientFilter))
      && (issueStatusFilter === 'all' || issue.status === issueStatusFilter)
      && (issuePriorityFilter === 'all' || issue.priority === issuePriorityFilter)
      && (issueLabelFilter === 'all' || issueLabels.some(link => link.issue_id === issue.id && link.label_id === issueLabelFilter));
  }).sort((a, b) => {
    if (issueSort === 'priority') {
      const rank: Record<string, number> = { highest: 0, high: 1, medium: 2, low: 3, lowest: 4 };
      return (rank[a.priority] ?? 5) - (rank[b.priority] ?? 5) || b.updated_at.localeCompare(a.updated_at);
    }
    if (issueSort === 'due_date') {
      const aDue = a.due_date || a.end_date || '9999-12-31';
      const bDue = b.due_date || b.end_date || '9999-12-31';
      return aDue.localeCompare(bDue) || b.updated_at.localeCompare(a.updated_at);
    }
    return b.updated_at.localeCompare(a.updated_at);
  });

  const activeProjectIssues = activeProjectId
    ? issues.filter(issue => issue.project_id === activeProjectId)
    : [];

  async function createLabel(event: FormEvent) {
    event.preventDefault();
    const projectId = labelProject || taskProject || projects[0]?.id;
    const name = labelName.trim();
    if (!projectId || !name) return;
    setBusy(true); setError(''); setMessage('');
    const { error } = await supabase.from('labels').insert({ project_id: projectId, name, color: labelColor });
    if (error) setError(error.message);
    else { setLabelName(''); setMessage('Etiqueta criada.'); await loadWorkspaces(); }
    setBusy(false);
  }

  async function deleteLabel(label: Label) {
    if (!window.confirm(`Excluir a etiqueta "${label.name}"? Ela será removida das tarefas associadas.`)) return;
    setBusy(true); setError(''); setMessage('');
    const { error } = await supabase.from('labels').delete().eq('id', label.id);
    if (error) setError(error.message);
    else { setMessage('Etiqueta excluída.'); await loadWorkspaces(); }
    setBusy(false);
  }

  async function toggleIssueLabel(issue: Issue, label: Label) {
    const exists = issueLabels.some(link => link.issue_id === issue.id && link.label_id === label.id);
    setBusy(true); setError(''); setMessage('');
    const result = exists
      ? await supabase.from('issue_labels').delete().eq('issue_id', issue.id).eq('label_id', label.id)
      : await supabase.from('issue_labels').insert({ issue_id: issue.id, label_id: label.id });
    if (result.error) setError(result.error.message);
    else { setMessage(exists ? 'Etiqueta removida da tarefa.' : 'Etiqueta associada à tarefa.'); await loadWorkspaces(); }
    setBusy(false);
  }

  async function moveIssueToStatus(issue: Issue, status: string) {
    if (issue.status === status) return;
    setBusy(true); setError(''); setMessage('');
    const { error } = await supabase.from('issues').update({ status }).eq('id', issue.id);
    if (error) setError(error.message);
    else { setMessage('Tarefa movida no quadro.'); await loadWorkspaces(); }
    setBusy(false);
  }

  async function addIssueDependency(successor: Issue) {
    const predecessorId = dependencyDrafts[successor.id];
    if (!predecessorId || predecessorId === successor.id) return;
    if (issueDependencies.some(dep => dep.predecessor_id === predecessorId && dep.successor_id === successor.id)) {
      setError('Essa dependência já existe.'); return;
    }
    setBusy(true); setError(''); setMessage('');
    const { error } = await (supabase as any).from('issue_dependencies').insert({ predecessor_id: predecessorId, successor_id: successor.id });
    if (error) setError(error.message);
    else { setMessage('Dependência adicionada.'); setDependencyDrafts(current => ({ ...current, [successor.id]: '' })); await loadWorkspaces(); }
    setBusy(false);
  }

  async function removeIssueDependency(dependency: IssueDependency) {
    setBusy(true); setError(''); setMessage('');
    const { error } = await (supabase as any).from('issue_dependencies').delete().eq('id', dependency.id);
    if (error) setError(error.message);
    else { setMessage('Dependência removida.'); await loadWorkspaces(); }
    setBusy(false);
  }

  async function saveIssueScheduleDate(issue: Issue, field: 'start_date' | 'end_date', value: string) {
    const startDate = field === 'start_date' ? value : issue.start_date;
    const endDate = field === 'end_date' ? value : (issue.end_date || issue.due_date);
    if (startDate && endDate && startDate > endDate) {
      setError('A data de início não pode ser posterior ao término. Ajuste as datas antes de salvar.');
      await loadWorkspaces();
      return;
    }
    const update = field === 'start_date'
      ? { start_date: value || null }
      : { end_date: value || null, due_date: value || null };
    setBusy(true); setError(''); setMessage('');
    const { error } = await supabase.from('issues').update(update).eq('id', issue.id);
    if (error) setError('Não foi possível salvar a data: ' + error.message);
    else { setMessage('Data da tarefa atualizada.'); await loadWorkspaces(); }
    setBusy(false);
  }
  async function saveIssueDuration(issue: Issue, durationDays: number) {
    const duration_days = Math.max(1, Math.min(365, Math.floor(durationDays || 1)));
    setBusy(true); setError(''); setMessage('');
    const { error } = await (supabase as any).from('issues').update({ duration_days }).eq('id', issue.id);
    if (error) setError(error.message); else { setMessage('Duração atualizada.'); await loadWorkspaces(); }
    setBusy(false);
  }
  async function generateSchedule() {
    const plan = filteredIssues.slice();
    if (!plan.length) { setError('Não há tarefas visíveis para planejar.'); return; }
    const ids = new Set(plan.map(issue => issue.id));
    const hiddenPredecessors = issueDependencies.filter(dep => ids.has(dep.successor_id) && !ids.has(dep.predecessor_id));
    if (hiddenPredecessors.length) {
      setError('Cronograma não gerado: há predecessoras ocultas pelos filtros. Limpe a busca e os filtros para calcular a sequência completa.');
      return;
    }
    const deps = issueDependencies.filter(dep => ids.has(dep.predecessor_id) && ids.has(dep.successor_id));
    const indegree = new Map(plan.map(issue => [issue.id, 0])); const outgoing = new Map<string, string[]>();
    deps.forEach(dep => { indegree.set(dep.successor_id, (indegree.get(dep.successor_id) || 0) + 1); outgoing.set(dep.predecessor_id, [...(outgoing.get(dep.predecessor_id) || []), dep.successor_id]); });
    const queue = plan.filter(issue => indegree.get(issue.id) === 0).map(issue => issue.id); const order: string[] = [];
    while (queue.length) { const id = queue.shift()!; order.push(id); for (const next of outgoing.get(id) || []) { indegree.set(next, (indegree.get(next) || 0) - 1); if (indegree.get(next) === 0) queue.push(next); } }
    if (order.length !== plan.length) { setError('Cronograma não gerado: confira as dependências, pode haver um ciclo.'); return; }
    const starts = new Map<string,string>(), ends = new Map<string,string>();
    const addDays = (date:string, days:number) => { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate()+days); return d.toISOString().slice(0,10); };
    for (const id of order) { const issue = plan.find(item=>item.id===id)!; const preds = deps.filter(dep=>dep.successor_id===id).map(dep=>dep.predecessor_id); const start = preds.reduce((latest,pred)=>ends.get(pred)!>latest?ends.get(pred)!:latest,scheduleStartDate); starts.set(id,start); ends.set(id,addDays(start,Math.max(1,Math.min(365,issue.duration_days||1))-1)); }
    setBusy(true); setError(''); setMessage('');
    for (const id of order) { const start_date=starts.get(id)!, end_date=ends.get(id)!; const {error}=await supabase.from('issues').update({start_date,end_date,due_date:end_date}).eq('id',id); if(error){setError('Falha ao salvar cronograma: '+error.message);setBusy(false);return;} }
    setMessage('Cronograma salvo. As durações foram calculadas em dias corridos.'); await loadWorkspaces(); setTaskView('timeline'); setBusy(false);
  }

  async function saveTimelineDates(issue: Issue, startDate: string, endDate: string) {
    if (startDate && endDate && startDate > endDate) { setError('A data de início não pode ser posterior ao término.'); return; }
    setBusy(true); setError(''); setMessage('');
    const { error } = await supabase.from('issues').update({ start_date: startDate || null, end_date: endDate || null, due_date: endDate || issue.due_date || null }).eq('id', issue.id);
    if (error) setError(error.message); else { setMessage('Período da tarefa atualizado.'); await loadWorkspaces(); }
    setBusy(false);
  }

  async function deleteIssue(issue: Issue) {
    if (!window.confirm(`Excluir a tarefa "${issue.title}"? Esta ação não pode ser desfeita.`)) return;
    setBusy(true); setError(''); setMessage('');
    const { error } = await supabase.from('issues').delete().eq('id', issue.id);
    if (error) setError(error.message);
    else { setMessage('Tarefa excluída.'); await loadWorkspaces(); }
    setBusy(false);
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  }

  function openProject(projectId: string) {
    setActiveProjectId(projectId);
    setProjectSection('tasks');
    setActivePage('tasks');
    setIssueProjectFilter(projectId);
    setIssueClientFilter('all');
    setTaskProject(projectId);
    setLabelProject(projectId);
    setTaskView('kanban');
    setTeamClientsWorkspace(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function closeProject() {
    setActiveProjectId(null);
    setProjectSection('tasks');
    setActivePage('overview');
    setIssueProjectFilter('all');
    setIssueClientFilter('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#" onClick={event=>{event.preventDefault();closeProject();setActivePage('overview');}}><span className="brand-mark">L</span><span>lock<span className="brand-light">project</span></span></a>{session && <><span className="topbar-context">{workspaces.find(w=>w.id===selectedWorkspace)?.name || 'Workspace'}</span><label className="theme-picker" title="Escolher aparência"><span aria-hidden="true">{theme === 'dark' ? '☾' : '☀'}</span><select aria-label="Tema da interface" value={theme} onChange={event=>setTheme(event.target.value as 'dark' | 'light')}><option value="dark">Tema escuro</option><option value="light">Tema claro</option></select></label><span className="topbar-user">{session.user.email}</span><button className="button button-quiet" onClick={signOut}>Sair</button></>}</header>
    {session && <aside className="product-sidebar">
      <div className="sidebar-group-label">WORKSPACE</div>
      <button className={activePage==='overview'&&!activeProjectId?'sidebar-link active':'sidebar-link'} onClick={()=>{closeProject();setActivePage('overview');}}>▦ <span>Visão geral</span></button>
      <button className={activePage==='projects'&&!activeProjectId?'sidebar-link active':'sidebar-link'} onClick={()=>{closeProject();setActivePage('projects');}}>◇ <span>Projetos</span><small>{projects.length}</small></button>
      <button className={activePage==='clients'&&!activeProjectId?'sidebar-link active':'sidebar-link'} onClick={()=>{closeProject();setActivePage('clients');}}>◎ <span>Clientes</span><small>{clients.length}</small></button>
      <button className={activePage==='tasks'||activeProjectId?'sidebar-link active':'sidebar-link'} onClick={()=>{setActiveProjectId(null);setActivePage('tasks');setIssueProjectFilter('all');setIssueClientFilter('all');}}>☷ <span>Tarefas</span><small>{issues.length}</small></button>
      {(isPlatformAdmin || workspaces.length === 0 || teamMembers.some(member => member.user_id === session.user.id && ['owner', 'admin'].includes(member.role))) && <><div className="sidebar-divider"/><div className="sidebar-group-label">ADMINISTRAÇÃO</div>
      <button className={activePage==='admin'&&!activeProjectId?'sidebar-link active':'sidebar-link'} onClick={()=>{closeProject();setActivePage('admin');}}>⚙ <span>Times e acessos</span></button>
      {isPlatformAdmin && <button className={activePage==='users'&&!activeProjectId?'sidebar-link active':'sidebar-link'} onClick={()=>{closeProject();setActivePage('users');}}>♙ <span>Administração de usuários</span><small>{adminUsers.length}</small></button>}</>}
      <div className="sidebar-divider"/><div className="sidebar-group-label">SEUS PROJETOS</div>
      {projects.slice(0,8).map(project=><button key={project.id} className={'sidebar-project '+(activeProjectId===project.id?'active':'')} onClick={()=>openProject(project.id)}><span>{project.key.slice(0,2)}</span><label>{project.name}</label></button>)}
      <div className="sidebar-bottom"><span className="sidebar-avatar">{(session.user.email?.[0]??'U').toUpperCase()}</span><div><strong>{session.user.user_metadata?.display_name||session.user.email?.split('@')[0]}</strong><small>{session.user.email}</small></div></div>
    </aside>}
    {!isSupabaseConfigured && <div className="notice"><strong>Configuração pendente</strong><span>Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env local para habilitar a autenticação.</span></div>}
    <section className="content-panel">
      {!ready ? <div className="loading">Preparando seu espaço…</div> : session ? <div className={'dashboard dashboard-home page-'+activePage+(activeProjectId?' page-project project-section-'+projectSection:'')}>
        <div className="dashboard-heading"><div><p className="eyebrow"><span className="eyebrow-dot"/> {activeProjectId ? 'ÁREA DO PROJETO' : 'VISÃO GERAL'}</p><h1>{activeProjectId ? projects.find(project => project.id === activeProjectId)?.name || 'Projeto' : `Bom te ver, ${session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'por aí'}.`}</h1><p className="muted">{activeProjectId ? `${projects.find(project => project.id === activeProjectId)?.key || ''} · ${clients.find(client => client.id === projects.find(project => project.id === activeProjectId)?.client_id)?.name || 'Sem cliente'}` : 'Aqui está um panorama do que está acontecendo nos seus espaços.'}</p></div><span className="avatar">{(session.user.email?.[0] ?? 'L').toUpperCase()}</span></div>
        {!activeProjectId && <><div className="stats-grid overview-summary-grid">
          <article className="stat-card"><span className="stat-icon">◇</span><span className="stat-label">Clientes</span><strong>{clients.length}</strong><small>Total de clientes cadastrados</small></article>
          <article className="stat-card"><span className="stat-icon">◷</span><span className="stat-label">Projetos</span><strong>{projects.length}</strong><small>Total de projetos cadastrados</small></article>
        </div>
        <OverviewInsights projects={projects} issues={issues} profiles={profiles} dependencies={issueDependencies} onOpenIssue={issue => { setActivePage('tasks'); setSelectedIssue(issue as Issue); }} onOpenProject={openProject} />
        <div className="dashboard-columns">
          <section className="dashboard-section"><div className="section-title"><div><p className="eyebrow">SEUS PROJETOS</p><h2>Projetos recentes</h2></div><span className="count">{projects.length}</span></div>
            {projects.length ? <div className="project-list">{projects.slice(0,6).map(p=><article className="project-row project-row-clickable" key={p.id} role="button" tabIndex={0} onClick={()=>openProject(p.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();openProject(p.id);}}}><span className="project-mark">{p.key.slice(0,2)}</span><div className="project-copy"><strong>{p.name}</strong><span>{p.key} · {clients.find(client=>client.id===p.client_id)?.name ?? 'Sem cliente'} · {p.status}</span></div><span className="project-status">Ativo</span></article>)}</div> : <div className="empty-state compact-empty"><span className="empty-icon">◇</span><strong>Seu primeiro projeto começa aqui</strong><p>Crie um projeto para reunir tarefas e acompanhar as entregas.</p></div>}
            <section className="client-management" id="client-management">
              <div className="section-title"><div><p className="eyebrow">CLIENTES DO TIME</p><h2>Clientes</h2></div><span className="count">{clients.filter(client=>client.workspace_id===(selectedWorkspace||workspaces[0]?.id)).length}</span></div>
              <div className="client-list">{clients.filter(client=>client.workspace_id===(selectedWorkspace||workspaces[0]?.id)).map(client=><article className="client-row client-row-clickable" key={client.id} role="button" tabIndex={0} onClick={()=>{setIssueClientFilter(client.id);setIssueProjectFilter('all');document.getElementById('task-management')?.scrollIntoView({behavior:'smooth',block:'start'});}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setIssueClientFilter(client.id);setIssueProjectFilter('all');document.getElementById('task-management')?.scrollIntoView({behavior:'smooth',block:'start'});}}}><span className="client-mark">{client.name.slice(0,1).toUpperCase()}</span><div className="client-copy"><strong>{client.name}</strong><span>{projects.filter(project=>project.client_id===client.id).length} projetos · {client.status==='active'?'Ativo':'Arquivado'}</span>{client.description&&<small>{client.description}</small>}</div></article>)}</div>
              <form className="client-create-form" onSubmit={createClient}>
                <div className="field"><label htmlFor="client-workspace">Time</label><select id="client-workspace" value={selectedWorkspace||workspaces[0]?.id||''} onChange={event=>{setSelectedWorkspace(event.target.value);setProjectClient(clients.find(client=>client.workspace_id===event.target.value)?.id||'');}} required>{workspaces.map(workspace=><option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></div>
                <div className="field"><label htmlFor="client-name">Nome do cliente</label><input id="client-name" value={clientName} onChange={event=>setClientName(event.target.value)} placeholder="Ex.: Acme, Loja Central" maxLength={160} required/></div>
                <div className="field"><label htmlFor="client-description">Descrição <span className="optional">(opcional)</span></label><input id="client-description" value={clientDescription} onChange={event=>setClientDescription(event.target.value)} placeholder="Contexto ou contato principal" maxLength={500}/></div>
                <button className="button button-primary" disabled={busy||!clientName.trim()||!selectedWorkspace}>{busy?'Salvando…':'Adicionar cliente'} ↗</button>
              </form>
            </section>
            <form className="create-project-form" onSubmit={async event => {
              event.preventDefault();
              if (!session?.user || !workspaces.length || !projectName.trim() || !projectClient) return;
              setBusy(true); setError(''); setMessage('');
              const base = projectName.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'').slice(0,5) || 'PROJ';
              const { error } = await (supabase as any).from('projects').insert({name:projectName.trim(),key:base+Date.now().toString().slice(-4),description:projectDescription.trim()||null,workspace_id:selectedWorkspace||workspaces[0].id,client_id:projectClient,created_by:session.user.id});
              if(error) setError(error.message); else {setProjectName('');setProjectDescription('');setMessage('Projeto criado com sucesso.'); await loadWorkspaces();}
              setBusy(false);
            }}><div className="section-title"><div><p className="eyebrow">NOVO PROJETO</p><h2>Comece uma iniciativa</h2></div></div>
              {workspaces.length ? <><div className="field"><label htmlFor="project-workspace">Time</label><select id="project-workspace" value={selectedWorkspace || workspaces[0].id} onChange={e=>{const id=e.target.value;setSelectedWorkspace(id);setProjectClient(clients.find(client=>client.workspace_id===id)?.id||'');}}>{workspaces.map(w=><option value={w.id} key={w.id}>{w.name}</option>)}</select></div><div className="field"><label htmlFor="project-client">Cliente</label><select id="project-client" value={projectClient || clients.find(client=>client.workspace_id===(selectedWorkspace||workspaces[0].id))?.id || ''} onChange={e=>setProjectClient(e.target.value)} required>{clients.filter(client=>client.workspace_id===(selectedWorkspace||workspaces[0].id)&&client.status==='active').map(client=><option value={client.id} key={client.id}>{client.name}</option>)}</select>{!clients.some(client=>client.workspace_id===(selectedWorkspace||workspaces[0].id)&&client.status==='active')&&<p className="muted">Cadastre um cliente para criar projetos neste time.</p>}</div><div className="field"><label htmlFor="project-name">Nome do projeto</label><input id="project-name" value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="Ex.: Redesign do produto" maxLength={100} required/></div><div className="field"><label htmlFor="project-description">Descrição <span className="optional">(opcional)</span></label><textarea id="project-description" value={projectDescription} onChange={e=>setProjectDescription(e.target.value)} placeholder="Qual é o objetivo deste projeto?" rows={2} maxLength={500}/></div><button className="button button-primary" disabled={busy||!projectName.trim()||!projectClient||!clients.some(client=>client.id===projectClient&&client.workspace_id===(selectedWorkspace||workspaces[0].id))}>{busy?'Criando…':'Criar projeto'} ↗</button></> : <p className="muted">Crie um workspace abaixo antes de adicionar projetos.</p>}
            </form>
          </section>
          <section className="dashboard-section"><div className="section-title"><div><p className="eyebrow">ACOMPANHAMENTO</p><h2>Atividade recente</h2></div><span className="count">{issues.length}</span></div>
            {issues.length ? <div className="activity-list">{issues.slice(0,7).map(i=><article className="activity-row" key={i.id}><span className="issue-dot">•</span><div className="activity-copy"><strong>{i.title}</strong><span>{projects.find(p=>p.id===i.project_id)?.key ?? 'TASK'}-{i.issue_number}</span><small>{i.status.replace(/_/g,' ')} · {new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(i.updated_at))}</small></div><span className={'priority priority-'+i.priority.toLowerCase()}>{i.priority}</span></article>)}</div> : <div className="empty-state compact-empty"><span className="empty-icon">◷</span><strong>Sem atividade por enquanto</strong><p>As tarefas recentes vão aparecer aqui quando você começar a trabalhar nos projetos.</p></div>}
            <div className="progress-card"><div className="progress-top"><div><span className="stat-label">Progresso geral</span><strong>{issues.length ? Math.round(issues.filter(i=>['done','completed','closed','concluido','concluído'].includes(i.status.toLowerCase())).length/issues.length*100):0}%</strong></div><span className="progress-check">✓</span></div><div className="progress-track"><span style={{width:(issues.length?issues.filter(i=>['done','completed','closed','concluido','concluído'].includes(i.status.toLowerCase())).length/issues.length*100:0)+'%'}}/></div><p>{issues.filter(i=>['done','completed','closed','concluido','concluído'].includes(i.status.toLowerCase())).length} de {issues.length} tarefas concluídas</p></div>
          </section>
        </div></>}
        {activeProjectId && <><div className="project-workspace-heading"><button type="button" className="button button-quiet" onClick={closeProject}>← Todos os projetos</button><div><span className="eyebrow">ESPAÇO DO PROJETO · {projects.find(project => project.id === activeProjectId)?.key || ''}</span><h2>{projects.find(project => project.id === activeProjectId)?.name}</h2><p className="muted">{projects.find(project => project.id === activeProjectId)?.description || 'Central de planejamento, execução e acompanhamento deste projeto.'}</p></div><span className="count">{filteredIssues.length} tarefas</span></div><nav className="project-section-nav" aria-label="Menu do projeto"><button className={projectSection==='summary'?'active':''} onClick={()=>setProjectSection('summary')}>▦ Resumo</button><button className={projectSection==='tasks'?'active':''} onClick={()=>{setProjectSection('tasks');setTaskView('kanban');}}>☷ Tarefas</button><button className={projectSection==='hierarchy'?'active':''} onClick={()=>{setProjectSection('hierarchy');setTaskView('hierarchy');}}>⌘ Hierarquia</button><button className={projectSection==='timeline'?'active':''} onClick={()=>{setProjectSection('timeline');setTaskView('timeline');}}>↗ Cronograma</button><button className={projectSection==='roadmap'?'active':''} onClick={()=>{setProjectSection('roadmap');setTaskView('roadmap');}}>▤ Roadmap</button></nav>{projectSection==='summary'&&<section className="project-summary-grid"><article className="project-summary-card"><span>Tarefas concluídas</span><strong>{activeProjectIssues.filter(issue=>issue.status==='done').length} / {activeProjectIssues.length}</strong><div className="progress-track"><span style={{width:(activeProjectIssues.length?activeProjectIssues.filter(issue=>issue.status==='done').length/activeProjectIssues.length*100:0)+'%'}}/></div></article><article className="project-summary-card"><span>Em andamento</span><strong>{activeProjectIssues.filter(issue=>issue.status==='in_progress').length}</strong><small>Tarefas em execução</small></article><article className="project-summary-card"><span>Com prazo vencido</span><strong>{activeProjectIssues.filter(issue=>issue.status!=='done'&&issue.status!=='cancelled'&&(issue.due_date||issue.end_date)&&((issue.due_date||issue.end_date)!)<new Date().toISOString().slice(0,10)).length}</strong><small>Itens que precisam de atenção</small></article><article className="project-summary-card"><span>Prioridade urgente</span><strong>{activeProjectIssues.filter(issue=>issue.priority==='highest'&&issue.status!=='done').length}</strong><small>Itens prioritários em aberto</small></article><div className="project-summary-card project-summary-wide"><div className="section-title"><div><p className="eyebrow">PRÓXIMOS PASSOS</p><h3>Próximas tarefas com prazo</h3></div><button className="text-button" onClick={()=>setProjectSection('tasks')}>Abrir tarefas →</button></div>{activeProjectIssues.filter(issue=>issue.status!=='done'&&issue.status!=='cancelled'&&(issue.due_date||issue.end_date)).sort((a,b)=>(a.due_date||a.end_date||'9999-12-31').localeCompare(b.due_date||b.end_date||'9999-12-31')).slice(0,5).map(issue=><div className="project-upcoming-row" key={issue.id}><span>{issue.title}</span><small>{issue.due_date||issue.end_date}</small><span className={'priority priority-'+issue.priority}>{issue.priority}</span></div>)}{!activeProjectIssues.some(issue=>issue.status!=='done'&&issue.status!=='cancelled'&&(issue.due_date||issue.end_date))&&<p className="muted">Ainda não há tarefas abertas com prazo definido.</p>}</div><div className="project-summary-card project-summary-wide"><div className="section-title"><div><p className="eyebrow">ESTRUTURA E ENTREGA</p><h3>Marcos e fases</h3></div><button className="text-button" onClick={()=>{setProjectSection('hierarchy');setTaskView('hierarchy');}}>Ver hierarquia →</button></div>{activeProjectIssues.filter(issue=>issue.type==='epic'||issue.type==='story').map(phase=>{const children=activeProjectIssues.filter(issue=>issue.parent_issue_id===phase.id);const completed=children.filter(issue=>issue.status==='done').length;const progress=children.length?Math.round(completed/children.length*100):(phase.status==='done'?100:0);return <div className="project-phase-row" key={phase.id}><div className="project-phase-copy"><strong>{phase.title}</strong><small>{phase.type==='epic'?'Épico':'História'} · {children.length?completed+' de '+children.length+' tarefas concluídas':phase.status==='done'?'Concluído':'Sem tarefas vinculadas'}</small></div><div className="project-phase-progress"><div className="progress-track"><span style={{width:progress+'%'}}/></div><small>{progress}%</small></div></div>})}{!activeProjectIssues.some(issue=>issue.type==='epic'||issue.type==='story')&&<p className="muted">Crie épicos ou histórias para organizar o trabalho em fases e acompanhar o progresso por etapa.</p>}</div></section>}</>}
        <section className="task-management" id="task-management">
          <div className="section-title task-management-heading"><div><p className="eyebrow">{activeProjectId ? 'EXECUÇÃO DO PROJETO' : 'EXECUÇÃO'}</p><h2>{activeProjectId ? 'Tarefas do projeto' : 'Gerenciar tarefas'}</h2></div><div className="task-heading-actions"><span className="count">{activeProjectId ? filteredIssues.length : issues.length} tarefas</span>{activeProjectId && <button type="button" className="button button-primary" onClick={() => { setEditingIssueId(null); setTaskProject(activeProjectId); setTaskTitle(''); setTaskDescription(''); setTaskType('task'); setTaskParentIssue(''); setTaskStatus('backlog'); setTaskPriority('medium'); setTaskDueDate(''); setTaskStartDate(''); setTaskEndDate(''); setTaskAssignee(''); setQuickCreateOpen(value => !value); }}>＋ Nova tarefa</button>}</div></div>
          {(!activeProjectId || quickCreateOpen || editingIssueId) && <form id="task-form" className={'task-form '+(activeProjectId?'task-quick-create ':'')+(editingIssueId?'task-edit-modal':'')} onSubmit={saveIssue}>
            <div className="task-form-heading"><strong>{editingIssueId ? 'Editar tarefa' : 'Nova tarefa'}</strong>{editingIssueId && <button type="button" className="text-button" onClick={() => { setEditingIssueId(null); setQuickCreateOpen(false); setTaskTitle(''); setTaskDescription(''); setTaskType('task'); setTaskParentIssue(''); setTaskDueDate(''); setTaskStartDate(''); setTaskEndDate(''); setTaskAssignee(''); setTaskStatus('backlog'); setTaskPriority('medium'); }}>Cancelar edição</button>}</div>
            <div className="task-form-grid">
              <div className="field task-title-field"><label htmlFor="task-title">Título da tarefa</label><input id="task-title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Ex.: Revisar fluxo de cadastro" maxLength={240} required /></div>
              <div className="field"><label htmlFor="task-type">Tipo de item</label><select id="task-type" value={taskType} onChange={e => { setTaskType(e.target.value); setTaskParentIssue(''); }}><option value="epic">Épico</option><option value="story">História</option><option value="task">Tarefa</option><option value="bug">Bug</option><option value="subtask">Subtarefa</option></select></div>
              <div className="field"><label htmlFor="task-parent">Tarefa-pai <span className="optional">(opcional)</span></label><select id="task-parent" value={taskParentIssue} onChange={e => setTaskParentIssue(e.target.value)} disabled={taskType === 'epic'}><option value="">Sem tarefa-pai</option>{issues.filter(parent => parent.id !== editingIssueId && parent.project_id === (taskProject || projects[0]?.id) && (taskType === 'subtask' ? parent.type !== 'subtask' : parent.type === 'epic')).map(parent => <option key={parent.id} value={parent.id}>{parent.type.toUpperCase()} · {parent.title}</option>)}</select><small className="muted">Histórias, tarefas e bugs podem pertencer a um épico. Subtarefas podem pertencer a um item que não seja subtarefa.</small></div>
              <div className="field task-description-field"><label htmlFor="task-description">Descrição <span className="optional">(opcional)</span></label><textarea id="task-description" value={taskDescription} onChange={e => setTaskDescription(e.target.value)} placeholder="Contexto, critérios de aceite ou próximos passos" rows={2} maxLength={4000}/></div>
              <div className="field"><label htmlFor="task-project">Projeto</label><select id="task-project" value={taskProject || projects[0]?.id || ''} onChange={e => { setTaskProject(e.target.value); setTaskAssignee(''); setTaskParentIssue(''); }} required disabled={!projects.length}>{projects.filter(p => !activeProjectId || p.id === activeProjectId).map(p => <option key={p.id} value={p.id}>{p.key} · {p.name}</option>)}</select></div>
              <div className="field"><label htmlFor="task-status">Status</label><select id="task-status" value={taskStatus} onChange={e => setTaskStatus(e.target.value)}><option value="backlog">Backlog</option><option value="todo">A fazer</option><option value="in_progress">Em andamento</option><option value="in_review">Em revisão</option><option value="done">Concluída</option><option value="cancelled">Cancelada</option></select></div>
              <div className="field"><label htmlFor="task-priority">Prioridade</label><select id="task-priority" value={taskPriority} onChange={e => setTaskPriority(e.target.value)}><option value="lowest">Mínima</option><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="highest">Urgente</option></select></div>
              <div className="field"><label htmlFor="task-assignee">Responsável <span className="optional">(opcional)</span></label><select id="task-assignee" value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)}><option value="">Sem responsável</option>{teamMembers.filter(member => member.workspace_id === projects.find(p => p.id === (taskProject || projects[0]?.id))?.workspace_id).map(member => <option key={member.user_id} value={member.user_id}>{profiles.find(profile => profile.id === member.user_id)?.display_name || `Membro ${member.user_id.slice(0, 8)}`}</option>)}</select></div>
              <div className="field"><label htmlFor="task-start-date">Início <span className="optional">(opcional)</span></label><input id="task-start-date" type="date" value={taskStartDate} max={taskEndDate || taskDueDate || undefined} onChange={e => setTaskStartDate(e.target.value)} /></div>
              <div className="field"><label htmlFor="task-end-date">Término <span className="optional">(opcional)</span></label><input id="task-end-date" type="date" value={taskEndDate} min={taskStartDate || undefined} onChange={e => { setTaskEndDate(e.target.value); setTaskDueDate(e.target.value); }} /></div>
              <div className="field"><label htmlFor="task-due-date">Prazo legado <span className="optional">(opcional)</span></label><input id="task-due-date" type="date" value={taskDueDate} min={taskStartDate || undefined} onChange={e => { setTaskDueDate(e.target.value); if (!taskEndDate) setTaskEndDate(e.target.value); }} /></div>
            </div>
            <button className="button button-primary" disabled={busy || !projects.length || !taskTitle.trim()}>{busy ? 'Salvando…' : editingIssueId ? 'Salvar alterações' : 'Criar tarefa'} ↗</button>
            {!projects.length && <p className="muted">Crie um projeto antes de cadastrar tarefas.</p>}
          </form>}
          {!activeProjectId && <section className="label-management">
            <div className="section-title"><div><p className="eyebrow">ORGANIZAÇÃO</p><h2>Etiquetas do projeto</h2></div><span className="count">{labels.length}</span></div>
            <form className="label-create-form" onSubmit={createLabel}>
              <div className="field"><label htmlFor="label-project">Projeto</label><select id="label-project" value={labelProject || taskProject || projects[0]?.id || ''} onChange={e => setLabelProject(e.target.value)} required disabled={!projects.length}>{projects.map(p => <option key={p.id} value={p.id}>{p.key} · {p.name}</option>)}</select></div>
              <div className="field"><label htmlFor="label-name">Nome da etiqueta</label><input id="label-name" value={labelName} onChange={e => setLabelName(e.target.value)} placeholder="Ex.: Bug, UX, Backend" maxLength={50} required /></div>
              <div className="field label-color-field"><label htmlFor="label-color">Cor</label><input id="label-color" type="color" value={labelColor} onChange={e => setLabelColor(e.target.value)} /></div>
              <button className="button button-primary" disabled={busy || !projects.length || !labelName.trim()}>{busy ? 'Salvando…' : 'Criar etiqueta'} ↗</button>
            </form>
            <div className="label-list">
              {labels.filter(label => !labelProject && !taskProject ? true : label.project_id === (labelProject || taskProject || projects[0]?.id)).map(label => <span className="label-chip" key={label.id} style={{color: label.color, borderColor: label.color}}><span>{label.name}</span><button type="button" aria-label={`Excluir etiqueta ${label.name}`} disabled={busy} onClick={() => void deleteLabel(label)}>×</button></span>)}
              {!labels.length && <p className="muted">Crie etiquetas para categorizar o trabalho por tipo, área ou contexto.</p>}
            </div>
          </section>}
          <div className="task-filters">
            <div className="field search-field"><label htmlFor="issue-search">Buscar tarefas</label><input id="issue-search" value={issueSearch} onChange={e => setIssueSearch(e.target.value)} placeholder="Título, descrição ou código…" /></div>
            {!activeProjectId && <><div className="field"><label htmlFor="issue-project-filter">Projeto</label><select id="issue-project-filter" value={issueProjectFilter} onChange={e => setIssueProjectFilter(e.target.value)}><option value="all">Todos os projetos</option>{projects.filter(project => issueClientFilter === 'all' || project.client_id === issueClientFilter).map(p => <option key={p.id} value={p.id}>{p.key} · {p.name}</option>)}</select></div>
            <div className="field"><label htmlFor="issue-client-filter">Cliente</label><select id="issue-client-filter" value={issueClientFilter} onChange={e => {setIssueClientFilter(e.target.value);setIssueProjectFilter('all');}}><option value="all">Todos os clientes</option>{clients.filter(client => client.status === 'active').map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></div>
            </>}
            <div className="field"><label htmlFor="issue-status-filter">Status</label><select id="issue-status-filter" value={issueStatusFilter} onChange={e => setIssueStatusFilter(e.target.value)}><option value="all">Todos</option><option value="backlog">Backlog</option><option value="todo">A fazer</option><option value="in_progress">Em andamento</option><option value="in_review">Em revisão</option><option value="done">Concluída</option><option value="cancelled">Cancelada</option></select></div>
            <div className="field"><label htmlFor="issue-priority-filter">Prioridade</label><select id="issue-priority-filter" value={issuePriorityFilter} onChange={e => setIssuePriorityFilter(e.target.value)}><option value="all">Todas</option><option value="lowest">Mínima</option><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="highest">Urgente</option></select></div>
            <div className="field"><label htmlFor="issue-label-filter">Etiqueta</label><select id="issue-label-filter" value={issueLabelFilter} onChange={e => setIssueLabelFilter(e.target.value)}><option value="all">Todas</option>{labels.filter(label => issueProjectFilter === 'all' || label.project_id === issueProjectFilter).map(label => <option key={label.id} value={label.id}>{label.name}</option>)}</select></div>
            <div className="field"><label htmlFor="issue-sort">Ordenar por</label><select id="issue-sort" value={issueSort} onChange={e => setIssueSort(e.target.value as 'updated' | 'priority' | 'due_date')}><option value="updated">Mais recentes</option><option value="priority">Maior prioridade</option><option value="due_date">Prazo mais próximo</option></select></div>
            <button type="button" className="text-button clear-filters" onClick={() => { setIssueSearch(''); setIssueProjectFilter(activeProjectId || 'all'); setIssueClientFilter('all'); setIssueStatusFilter('all'); setIssuePriorityFilter('all'); setIssueLabelFilter('all'); setIssueSort('updated'); }}>Limpar filtros</button>
          </div>
          <div className="task-results-note">Exibindo {filteredIssues.length} de {issues.length} tarefas</div>
          <nav className="task-view-switch" role="group" aria-label="Visualização das tarefas">
            <button type="button" aria-pressed={taskView === 'kanban'} className={taskView === 'kanban' ? 'active' : ''} onClick={() => setTaskView('kanban')}>▦ Kanban</button>
            <button type="button" aria-pressed={taskView === 'list'} className={taskView === 'list' ? 'active' : ''} onClick={() => setTaskView('list')}>☷ Lista</button>
            <button type="button" aria-pressed={taskView === 'hierarchy'} className={taskView === 'hierarchy' ? 'active' : ''} onClick={() => setTaskView('hierarchy')}>⌘ Hierarquia</button>
            <button type="button" aria-pressed={taskView === 'timeline'} className={taskView === 'timeline' ? 'active' : ''} onClick={() => setTaskView('timeline')}>↗ Timeline</button>
            <button type="button" aria-pressed={taskView === 'roadmap'} className={taskView === 'roadmap' ? 'active' : ''} onClick={() => setTaskView('roadmap')}>▤ Roadmap</button>
          </nav>
          {taskView === 'kanban' ? <div className="kanban-board">
            {[
              { id: 'backlog', label: 'Backlog' }, { id: 'todo', label: 'A fazer' },
              { id: 'in_progress', label: 'Em andamento' }, { id: 'in_review', label: 'Em revisão' },
              { id: 'done', label: 'Concluída' }, { id: 'cancelled', label: 'Cancelada' }
            ].map(column => {
              const columnIssues = filteredIssues.filter(issue => issue.status === column.id);
              return <section className={'kanban-column' + (dragOverStatus === column.id ? ' kanban-column-drag-over' : '')} key={column.id}
                onDragEnter={event => { event.preventDefault(); setDragOverStatus(column.id); }}
                onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; if (dragOverStatus !== column.id) setDragOverStatus(column.id); }}
                onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOverStatus(current => current === column.id ? null : current); }}
                onDrop={event => { event.preventDefault(); const issueId = event.dataTransfer.getData('text/plain'); const issue = filteredIssues.find(item => item.id === issueId); setDragOverStatus(null); setDraggingIssueId(null); if (issue) void moveIssueToStatus(issue, column.id); }}>
                <header className="kanban-column-heading"><span className={'kanban-status-dot status-' + column.id}/><strong>{column.label}</strong><span className="count">{columnIssues.length}</span></header>
                <button type="button" className="kanban-add-task" onClick={() => { setEditingIssueId(null); setTaskProject(activeProjectId || (issueProjectFilter !== 'all' ? issueProjectFilter : projects[0]?.id || '')); setTaskTitle(''); setTaskDescription(''); setTaskType('task'); setTaskParentIssue(''); setTaskStatus(column.id); setTaskPriority('medium'); setTaskDueDate(''); setTaskStartDate(''); setTaskEndDate(''); setTaskAssignee(''); setQuickCreateOpen(true); document.getElementById('task-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>＋ Adicionar tarefa</button>
                <div className="kanban-cards">
                  {columnIssues.map(issue => <article className={'kanban-card' + (draggingIssueId === issue.id ? ' kanban-card-dragging' : '')} key={issue.id} draggable={!busy}
                    onDragStart={event => { setDraggingIssueId(issue.id); setDragOverStatus(null); event.dataTransfer.setData('text/plain', issue.id); event.dataTransfer.effectAllowed = 'move'; }}
                    onDragEnd={() => { setDraggingIssueId(null); setDragOverStatus(null); }}>
                    <div className="kanban-card-top"><span>{projects.find(p => p.id === issue.project_id)?.key ?? 'TASK'}-{issue.issue_number}</span><span className={'priority priority-' + issue.priority}>{({lowest:'Mínima',low:'Baixa',medium:'Média',high:'Alta',highest:'Urgente'} as Record<string,string>)[issue.priority] ?? issue.priority}</span></div>
                    <button type="button" className="kanban-card-title-button" onClick={() => setSelectedIssue(issue)}>{issue.title}</button>
                    {issue.description && <p className="kanban-card-description">{issue.description}</p>}
                    <div className="issue-labels">{labels.filter(label => label.project_id === issue.project_id).map(label => { const active = issueLabels.some(link => link.issue_id === issue.id && link.label_id === label.id); return <button type="button" key={label.id} className={'issue-label-toggle' + (active ? ' selected' : '')} style={{color: label.color, borderColor: label.color}} aria-pressed={active} disabled={busy} onClick={() => void toggleIssueLabel(issue, label)}>{active ? '✓ ' : '+ '}{label.name}</button>; })}</div>
                    <div className="kanban-assignee">{issue.assignee_id ? <><span className="assignee-avatar">{(profiles.find(profile => profile.id === issue.assignee_id)?.display_name || issue.assignee_id).slice(0, 1).toUpperCase()}</span><span>{profiles.find(profile => profile.id === issue.assignee_id)?.display_name || `Membro ${issue.assignee_id.slice(0, 8)}`}</span></> : <span className="unassigned">Sem responsável</span>}</div>
                    <div className="kanban-card-meta"><span>{projects.find(p => p.id === issue.project_id)?.name ?? 'Projeto'}</span><span>{issue.due_date ? new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',timeZone:'UTC'}).format(new Date(issue.due_date+'T00:00:00Z')) : 'Sem prazo'}</span></div>
                    <div className="kanban-card-actions"><button type="button" className="text-button" onClick={() => setSelectedIssue(issue)}>Detalhes</button><button type="button" className="text-button" onClick={() => startEditingIssue(issue)}>Editar</button><button type="button" className="text-button" onClick={() => startEditingIssue(issue)}>Editar</button><button type="button" className="text-button danger-text" disabled={busy} onClick={() => void deleteIssue(issue)}>Excluir</button></div>
                  </article>)}
                  {!columnIssues.length && <div className="kanban-empty">Solte uma tarefa aqui</div>}
                </div>
              </section>;
            })}
          </div> : taskView === 'timeline' ? <div className="timeline-view gantt-view">
            {(() => {
              const dated = [...filteredIssues].filter(issue => issue.start_date || issue.end_date || issue.due_date).sort((a,b) => (a.start_date || a.end_date || a.due_date || '').localeCompare(b.start_date || b.end_date || b.due_date || ''));
              const undated = filteredIssues.filter(issue => !issue.start_date && !issue.end_date && !issue.due_date);
              const dayMs = 86400000;
              const dateAt = (value: string) => new Date(value + 'T00:00:00Z');
              const iso = (date: Date) => date.toISOString().slice(0,10);
              const today = new Date(); today.setHours(0,0,0,0);
              const todayIso = iso(today);
              const allDates = dated.flatMap(issue => [issue.start_date,issue.end_date,issue.due_date].filter((value): value is string => !!value)).map(dateAt);
              const earliest = allDates.length ? Math.min(...allDates.map(date => date.getTime())) : today.getTime() - 14 * dayMs;
              const latest = allDates.length ? Math.max(...allDates.map(date => date.getTime())) : today.getTime() + 30 * dayMs;
              const start = new Date(Math.min(earliest,today.getTime()) - (timelineScale === 'week' ? 7 : 14) * dayMs);
              const end = new Date(Math.max(latest,today.getTime()) + (timelineScale === 'week' ? 14 : 30) * dayMs);
              const totalDays = Math.max(1,Math.ceil((end.getTime()-start.getTime())/dayMs));
              const position = (date: string) => Math.max(0,Math.min(100,((dateAt(date).getTime()-start.getTime())/dayMs/totalDays)*100));
              const monthMarks: {label:string;left:number;width:number}[] = [];
              let monthCursor = new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth(),1));
              while(monthCursor<end){const next=new Date(Date.UTC(monthCursor.getUTCFullYear(),monthCursor.getUTCMonth()+1,1));const left=Math.max(0,(monthCursor.getTime()-start.getTime())/dayMs/totalDays*100);const right=Math.min(100,(next.getTime()-start.getTime())/dayMs/totalDays*100);monthMarks.push({label:new Intl.DateTimeFormat('pt-BR',{month:'short',year:'2-digit',timeZone:'UTC'}).format(monthCursor),left,width:Math.max(0,right-left)});monthCursor=next;}
              const weekMarks: {label:string;left:number;width:number}[] = [];
              let weekCursor = new Date(start); weekCursor.setUTCDate(weekCursor.getUTCDate()-((weekCursor.getUTCDay()+6)%7));
              while(weekCursor<end){const next=new Date(weekCursor.getTime()+7*dayMs);const left=Math.max(0,(weekCursor.getTime()-start.getTime())/dayMs/totalDays*100);const right=Math.min(100,(next.getTime()-start.getTime())/dayMs/totalDays*100);weekMarks.push({label:new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',timeZone:'UTC'}).format(weekCursor),left,width:Math.max(0,right-left)});weekCursor=next;}
              const marks = timelineScale === 'week' ? weekMarks : monthMarks;
              return <>
                <div className="gantt-toolbar"><div><strong>Planejamento por período</strong><span>{dated.length} com período · {undated.length} sem datas · hoje {new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',timeZone:'UTC'}).format(today)}</span></div><div className="gantt-toolbar-actions"><span className="gantt-legend"><i/> Período</span><button type="button" className={timelineScale==='week'?'active':''} onClick={()=>setTimelineScale('week')}>Semanas</button><button type="button" className={timelineScale==='month'?'active':''} onClick={()=>setTimelineScale('month')}>Meses</button></div></div>
                <div className="gantt-scroll"><div className="gantt-canvas">
                  <div className="gantt-ruler"><div className="gantt-task-label">Tarefa / período</div><div className="gantt-calendar">{marks.map((mark,index)=><span key={index} style={{left:mark.left+'%',width:mark.width+'%'}}>{mark.label}</span>)}</div></div>
                  {dated.map(issue => {
                    const endDate = issue.end_date || issue.due_date || issue.start_date!;
                    const startDate = issue.start_date || iso(new Date(dateAt(endDate).getTime()-7*dayMs));
                    const startPos = position(startDate);
                    const endPos = position(endDate);
                    const width = Math.max(1.2,endPos-startPos);
                    const overdue = endDate < todayIso && issue.status !== 'done' && issue.status !== 'cancelled';
                    const isPhase = issue.type === 'epic' || issue.type === 'story'; const milestone = issue.type === 'milestone' || (!isPhase && !!issue.start_date && !!(issue.end_date || issue.due_date) && startDate === endDate);
                    const assigned = profiles.find(profile=>profile.id===issue.assignee_id)?.display_name || (issue.assignee_id ? 'Membro atribuído' : 'Sem responsável');
                    const project = projects.find(p=>p.id===issue.project_id);
                    return <article className={'gantt-row gantt-row-'+(isPhase ? issue.type : 'task')+(overdue?' gantt-row-overdue':'')} key={issue.id}>
                      <div className="gantt-task-label"><div className="gantt-title-line"><span className={'gantt-type-badge gantt-type-'+issue.type}>{issue.type==='epic'?'Fase':issue.type==='story'?'Entrega':issue.type==='milestone'?'Marco':'Tarefa'}</span><strong>{issue.title}</strong></div><small>{project?.key ?? 'TASK'}-{issue.issue_number} · {startDate===endDate?'Marco':new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',timeZone:'UTC'}).format(dateAt(startDate))+' – '+new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',timeZone:'UTC'}).format(dateAt(endDate))} · {assigned}</small>{(() => { const predecessors = issueDependencies.filter(dep => dep.successor_id === issue.id); const successors = issueDependencies.filter(dep => dep.predecessor_id === issue.id); const predecessorIssues = predecessors.map(dep => issues.find(item => item.id === dep.predecessor_id)).filter((item): item is Issue => !!item); const blocked = predecessorIssues.some(predecessor => predecessor.status !== 'done' && predecessor.status !== 'cancelled'); const scheduleConflict = !!issue.start_date && predecessorIssues.some(predecessor => { const predecessorEnd = predecessor.end_date || predecessor.due_date || predecessor.start_date; return !!predecessorEnd && predecessorEnd > issue.start_date!; }); return <div className={'gantt-dependencies'+(blocked?' is-blocked':'')+(scheduleConflict?' has-schedule-conflict':'')}><strong>{blocked ? '⛔ Bloqueada' : scheduleConflict ? '⚠ Conflito de datas' : '↔ Dependências'}</strong>{scheduleConflict && <span className="gantt-schedule-warning">O início está antes do término de uma predecessora.</span>}{predecessors.map(dep => { const predecessor = issues.find(item => item.id === dep.predecessor_id); return <span className="gantt-dependency-chip" key={dep.id}>Depende de: {predecessor?.title || 'Tarefa'} <button type="button" aria-label="Remover dependência" disabled={busy} onClick={() => void removeIssueDependency(dep)}>×</button></span>; })}{successors.map(dep => { const successor = issues.find(item => item.id === dep.successor_id); return <span className="gantt-dependency-chip" key={dep.id}>Desbloqueia: {successor?.title || 'Tarefa'}</span>; })}<div className="gantt-dependency-add"><select aria-label={'Predecessora de '+issue.title} value={dependencyDrafts[issue.id] || ''} disabled={busy} onChange={event=>setDependencyDrafts(current=>({...current,[issue.id]:event.target.value}))}><option value="">Adicionar predecessora…</option>{issues.filter(candidate=>candidate.id!==issue.id&&candidate.project_id===issue.project_id&&!issueDependencies.some(dep=>dep.predecessor_id===candidate.id&&dep.successor_id===issue.id)).map(candidate=><option key={candidate.id} value={candidate.id}>{projects.find(p=>p.id===candidate.project_id)?.key}-{candidate.issue_number} · {candidate.title}</option>)}</select><button type="button" disabled={busy||!dependencyDrafts[issue.id]} onClick={()=>void addIssueDependency(issue)}>Vincular</button></div></div>; })()}<div className="gantt-row-actions"><label>Início<input aria-label={'Data de início de '+issue.title} type="date" value={issue.start_date || ''} max={issue.end_date || issue.due_date || undefined} onChange={event=>void saveTimelineDates(issue,event.target.value,issue.end_date || issue.due_date || '')} disabled={busy}/></label><label>Término<input aria-label={'Data de término de '+issue.title} type="date" value={issue.end_date || issue.due_date || ''} min={issue.start_date || undefined} onChange={event=>void saveTimelineDates(issue,issue.start_date || '',event.target.value)} disabled={busy}/></label></div></div>
                      <div className="gantt-track"><span className="gantt-grid-line" style={{left:position(todayIso)+'%'}}/>{milestone?<button type="button" className={'gantt-milestone gantt-'+issue.status+(overdue?' overdue':'')} style={{left:startPos+'%'}} title={issue.title+' · marco '+endDate} onClick={()=>setSelectedIssue(issue)}/>:<button type="button" className={'gantt-bar gantt-'+issue.status+(overdue?' gantt-overdue':'')} style={{left:startPos+'%',width:width+'%'}} title={issue.title+' · '+startDate+' a '+endDate} onClick={()=>setSelectedIssue(issue)}><span>{issue.title}</span></button>}{issue.due_date && <span className="gantt-due-marker" style={{left:position(issue.due_date)+'%'}}/>}{overdue&&<span className="gantt-overdue-flag" style={{left:endPos+'%'}}>Atrasada</span>}</div>
                    </article>;
                  })}
                  {!dated.length && <div className="gantt-empty">Defina início e término em uma tarefa para posicioná-la no calendário.</div>}
                </div></div>
                {undated.length>0 && <section className="gantt-undated"><h4>Sem período definido <span>{undated.length}</span></h4>{undated.map(issue=><div className="gantt-undated-row" key={issue.id}><span className={'kanban-status-dot status-'+issue.status}/><strong>{issue.title}</strong><small>{projects.find(p=>p.id===issue.project_id)?.key ?? 'TASK'}-{issue.issue_number}</small><button type="button" className="text-button" onClick={()=>startEditingIssue(issue)}>Definir período</button></div>)}</section>}
                {!filteredIssues.length && <div className="empty-state compact-empty"><strong>Nenhuma tarefa para mostrar</strong><p>Adicione tarefas para montar a timeline.</p></div>}
              </>;
            })()}
          </div> : taskView === 'roadmap' ? <div className="roadmap-view roadmap-gantt-view">
            {(() => {
              const activeProjects = projects.filter(project => activeProjectId ? project.id === activeProjectId : (issueProjectFilter==='all'||project.id===issueProjectFilter) && (issueClientFilter==='all'||project.client_id===issueClientFilter));
              const roadmapItems = filteredIssues.filter(issue => activeProjects.some(project=>project.id===issue.project_id));
              const dated = roadmapItems.filter(issue=>issue.due_date).sort((a,b)=>(a.due_date||'').localeCompare(b.due_date||''));
              const day = 86400000;
              const today = new Date(); today.setHours(0,0,0,0);
              const first = dated.length ? new Date(dated[0].due_date+'T00:00:00Z') : new Date(today.getTime()-14*day);
              const last = dated.length ? new Date(dated[dated.length-1].due_date+'T00:00:00Z') : new Date(today.getTime()+45*day);
              const start = new Date(Math.min(first.getTime(),today.getTime())-7*day);
              const end = new Date(Math.max(last.getTime(),today.getTime())+21*day);
              const total = Math.max(1,Math.ceil((end.getTime()-start.getTime())/day));
              const pos=(date:string)=>Math.max(0,Math.min(100,((new Date(date+'T00:00:00Z').getTime()-start.getTime())/day/total)*100));
              const marks: {label:string;left:number;width:number}[]=[];
              let cursor=new Date(start.getFullYear(),start.getMonth(),1);
              while(cursor<end){const next=new Date(cursor.getFullYear(),cursor.getMonth()+1,1);const left=Math.max(0,(cursor.getTime()-start.getTime())/day/total*100);const right=Math.min(100,(next.getTime()-start.getTime())/day/total*100);marks.push({label:new Intl.DateTimeFormat('pt-BR',{month:'short',year:'numeric'}).format(cursor),left,width:Math.max(0,right-left)});cursor=next;}
              const renderRoadmapRow=(issue:Issue,depth=0):React.ReactNode=>{
                const due=issue.due_date?pos(issue.due_date):null;
                const left=due===null?0:Math.max(0,due-(14/total*100));
                const width=due===null?0:Math.max(1.5,due-left);
                return <div className={'roadmap-line roadmap-line-'+issue.type} key={issue.id}>
                  <div className="roadmap-line-label" style={{paddingLeft:(depth*18)+'px'}}><span className={'hierarchy-type hierarchy-type-'+issue.type}>{({epic:'ÉPICO',story:'HISTÓRIA',task:'TAREFA',bug:'BUG',subtask:'SUBTAREFA'} as Record<string,string>)[issue.type]??'TAREFA'}</span><button type="button" onClick={()=>setSelectedIssue(issue)}>{issue.title}</button><small>{issue.due_date?new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',timeZone:'UTC'}).format(new Date(issue.due_date+'T00:00:00Z')):'Sem prazo'}</small></div>
                  <div className="roadmap-line-track">{due!==null&&<><span className={'roadmap-bar roadmap-bar-'+issue.status} style={{left:left+'%',width:width+'%'}} title={issue.title+' · prazo '+issue.due_date}/><span className="roadmap-due-dot" style={{left:due+'%'}}/></>}</div>
                </div>;
              };
              return <>{activeProjects.map(project=>{
                const projectItems=roadmapItems.filter(issue=>issue.project_id===project.id);
                const rootItems=projectItems.filter(issue=>!issue.parent_issue_id||!projectItems.some(parent=>parent.id===issue.parent_issue_id));
                const renderTree=(issue:Issue,depth=0):React.ReactNode=><React.Fragment key={issue.id}>{renderRoadmapRow(issue,depth)}{projectItems.filter(child=>child.parent_issue_id===issue.id).map(child=>renderTree(child,depth+1))}</React.Fragment>;
                return <section className="roadmap-project roadmap-gantt-project" key={project.id}><header><div><span className="project-mark">{project.key.slice(0,2)}</span><div><strong>{project.name}</strong><small>{project.key} · {clients.find(client=>client.id===project.client_id)?.name??'Sem cliente'}</small></div></div><span className="count">{projectItems.length} itens</span></header>
                  <div className="roadmap-gantt-scroll"><div className="roadmap-gantt-canvas"><div className="roadmap-gantt-ruler"><div>Hierarquia</div><div className="roadmap-gantt-calendar">{marks.map((mark,index)=><span key={index} style={{left:mark.left+'%',width:mark.width+'%'}}>{mark.label}</span>)}</div></div>{rootItems.map(issue=>renderTree(issue))}{!projectItems.length&&<p className="muted">Adicione épicos e tarefas para visualizar o roadmap.</p>}</div></div>
                </section>;
              })}{!activeProjects.length&&<div className="empty-state compact-empty"><strong>Sem projetos para mostrar</strong><p>Abra um projeto ou ajuste os filtros.</p></div>}</>;
            })()}
          </div> : taskView === 'hierarchy' ? <div className="issue-hierarchy">
            {(() => {
              const visibleIds = new Set(filteredIssues.map(issue => issue.id));
              const hierarchyItems = filteredIssues.filter(issue => !issue.parent_issue_id || !visibleIds.has(issue.parent_issue_id));
              const renderHierarchyItem = (issue: Issue, depth = 0): React.ReactNode => {
                const children = filteredIssues.filter(child => child.parent_issue_id === issue.id);
                const typeLabel = ({ epic: 'ÉPICO', story: 'HISTÓRIA', task: 'TAREFA', bug: 'BUG', subtask: 'SUBTAREFA' } as Record<string, string>)[issue.type] ?? 'TAREFA';
                return <div className="hierarchy-node" key={issue.id}>
                  <article className="hierarchy-row" style={{ marginLeft: depth * 22 }}>
                    <span className={'hierarchy-type hierarchy-type-' + issue.type}>{typeLabel}</span>
                    <div className="hierarchy-main"><strong>{issue.title}</strong><small>{projects.find(p => p.id === issue.project_id)?.key ?? 'TASK'}-{issue.issue_number} · {projects.find(p => p.id === issue.project_id)?.name ?? 'Projeto'}</small></div>
                    <span className={'priority priority-' + issue.priority}>{({lowest:'Mínima',low:'Baixa',medium:'Média',high:'Alta',highest:'Urgente'} as Record<string,string>)[issue.priority] ?? issue.priority}</span>
                    <span className={'hierarchy-status status-text-' + issue.status}>{({backlog:'Backlog',todo:'A fazer',in_progress:'Em andamento',in_review:'Em revisão',done:'Concluída',cancelled:'Cancelada'} as Record<string,string>)[issue.status] ?? issue.status}</span>
                    <span className="hierarchy-assignee">{issue.assignee_id ? profiles.find(profile => profile.id === issue.assignee_id)?.display_name || 'Membro da equipe' : 'Sem responsável'}</span>
                    <div className="hierarchy-actions"><button type="button" className="text-button" onClick={() => setSelectedIssue(issue)}>Comentários</button><button type="button" className="text-button" onClick={() => startEditingIssue(issue)}>Editar</button></div>
                  </article>
                  {children.map(child => renderHierarchyItem(child, depth + 1))}
                </div>;
              };
              return hierarchyItems.length ? hierarchyItems.map(issue => renderHierarchyItem(issue)) : <div className="empty-state compact-empty"><strong>Nenhum item nessa combinação de filtros</strong><p>Limpe os filtros para ver a hierarquia completa.</p></div>;
            })()}
          </div> : <>{taskView === 'list' && <div className="schedule-builder"><div><strong>Planejador de cronograma</strong><p>Defina duração e predecessoras para preencher automaticamente início e término.</p></div><label>Data inicial<input type="date" value={scheduleStartDate} onChange={event=>setScheduleStartDate(event.target.value)} disabled={busy}/></label><button type="button" className="button button-primary" disabled={busy || !filteredIssues.length} onClick={()=>void generateSchedule()}>{busy?'Calculando…':'Gerar cronograma ↗'}</button></div>}<div className="task-table">
            <div className="task-table-head list-planning-head"><span>Tarefa</span><span>Dias</span><span>Predecessora</span><span>Início</span><span>Final</span><span>Status</span><span>Responsável</span><span>Prioridade</span><span>Prazo</span><span>Etiquetas</span><span>Ações</span></div>
            {filteredIssues.length ? filteredIssues.map(issue => <article className="task-table-row list-planning-row" key={issue.id}>
              <div className="task-name"><strong>{issue.title}</strong><small><span className="issue-type-tag">{({ epic: 'ÉPICO', story: 'HISTÓRIA', task: 'TAREFA', bug: 'BUG', subtask: 'SUBTAREFA' } as Record<string, string>)[issue.type] ?? 'TAREFA'}</span> · {projects.find(p => p.id === issue.project_id)?.key ?? 'TASK'}-{issue.issue_number}{issue.parent_issue_id ? ` · Pai: ${issues.find(parent => parent.id === issue.parent_issue_id)?.title ?? 'item vinculado'}` : ''}{issue.description ? ` · ${issue.description}` : ''}</small></div>
              <input className="list-inline-date list-inline-duration" aria-label={`Duração em dias de ${issue.title}`} type="number" min="1" max="365" value={issue.duration_days || 1} disabled={busy} onChange={event=>{const value=Number(event.target.value);setIssues(current=>current.map(item=>item.id===issue.id?{...item,duration_days:value}:item));}} onBlur={event=>void saveIssueDuration(issue,Number(event.target.value))}/>
              <div className="list-inline-dependency"><select aria-label={`Predecessora de ${issue.title}`} value={dependencyDrafts[issue.id] || ''} disabled={busy} onChange={event=>setDependencyDrafts(current=>({...current,[issue.id]:event.target.value}))}><option value="">Sem predecessora</option>{issues.filter(candidate=>candidate.id!==issue.id&&candidate.project_id===issue.project_id&&!issueDependencies.some(dep=>dep.predecessor_id===candidate.id&&dep.successor_id===issue.id)).map(candidate=><option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select><button type="button" className="text-button" disabled={busy||!dependencyDrafts[issue.id]} onClick={()=>void addIssueDependency(issue)}>Vincular</button>{issueDependencies.filter(dep=>dep.successor_id===issue.id).map(dep=><span className="list-dependency-chip" key={dep.id} title={issues.find(item=>item.id===dep.predecessor_id)?.title || 'Predecessora'}>{issues.find(item=>item.id===dep.predecessor_id)?.title || 'Predecessora'} <button type="button" onClick={()=>void removeIssueDependency(dep)} aria-label="Remover dependência">×</button></span>)}</div>
              <input className="list-inline-date" aria-label={`Data de início de ${issue.title}`} type="date" value={issue.start_date || ''} disabled={busy} onChange={event=>setIssues(current=>current.map(item=>item.id===issue.id?{...item,start_date:event.target.value||null}:item))} onBlur={event=>void saveIssueScheduleDate(issue,'start_date',event.target.value)}/>
              <input className="list-inline-date" aria-label={`Data final de ${issue.title}`} type="date" value={issue.end_date || issue.due_date || ''} disabled={busy} onChange={event=>setIssues(current=>current.map(item=>item.id===issue.id?{...item,end_date:event.target.value||null,due_date:event.target.value||null}:item))} onBlur={event=>void saveIssueScheduleDate(issue,'end_date',event.target.value)}/>
              <select aria-label={`Status de ${issue.title}`} value={issue.status} disabled={busy} onChange={e => void moveIssueToStatus(issue, e.target.value)}><option value="backlog">Backlog</option><option value="todo">A fazer</option><option value="in_progress">Em andamento</option><option value="in_review">Em revisão</option><option value="done">Concluída</option><option value="cancelled">Cancelada</option></select>
              <select aria-label={`Responsável por ${issue.title}`} value={issue.assignee_id ?? ''} disabled={busy} onChange={async e => { setBusy(true); setError(''); const { error } = await supabase.from('issues').update({ assignee_id: e.target.value || null }).eq('id', issue.id); if (error) setError(error.message); else { setMessage('Responsável atualizado.'); await loadWorkspaces(); } setBusy(false); }}><option value="">Sem responsável</option>{teamMembers.filter(member => member.workspace_id === projects.find(p => p.id === issue.project_id)?.workspace_id).map(member => <option key={member.user_id} value={member.user_id}>{profiles.find(profile => profile.id === member.user_id)?.display_name || `Membro ${member.user_id.slice(0, 8)}`}</option>)}</select>
              <select aria-label={`Prioridade de ${issue.title}`} value={issue.priority} disabled={busy} onChange={async e => { setBusy(true); setError(''); const { error } = await supabase.from('issues').update({ priority: e.target.value }).eq('id', issue.id); if (error) setError(error.message); else await loadWorkspaces(); setBusy(false); }}><option value="lowest">Mínima</option><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="highest">Urgente</option></select>
              <span className="task-due">{issue.due_date ? new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(issue.due_date+'T00:00:00Z')) : 'Sem prazo'}</span>
              <div className="issue-labels task-row-labels">{labels.filter(label => label.project_id === issue.project_id && issueLabels.some(link => link.issue_id === issue.id && link.label_id === label.id)).map(label => <span className="issue-label-toggle selected" key={label.id} style={{color: label.color, borderColor: label.color}}>{label.name}</span>)}</div>
              <div className="task-actions"><button type="button" className="text-button" onClick={() => setSelectedIssue(issue)}>Comentários</button><button type="button" className="text-button" onClick={() => startEditingIssue(issue)}>Editar</button><button type="button" className="text-button danger-text" disabled={busy} onClick={() => void deleteIssue(issue)}>Excluir</button></div>
            </article>) : <div className="empty-state compact-empty"><span className="empty-icon">◷</span><strong>{issues.length ? 'Nenhuma tarefa encontrada' : 'Nenhuma tarefa ainda'}</strong><p>{issues.length ? 'Tente ajustar a busca ou os filtros.' : 'Cadastre uma tarefa acima para acompanhar status, prioridade e prazo.'}</p></div>}
          </div></>}
        </section>
        {activePage === 'users' && isPlatformAdmin && <AdminUsersSection users={adminUsers} loading={adminUsersLoading} search={adminUserSearch} onSearchChange={setAdminUserSearch} onRefresh={() => void loadAdminUsers()} onOpenTeams={() => setActivePage('admin')} />}
        {activePage === 'admin' && (isPlatformAdmin || workspaces.length === 0 || teamMembers.some(member => member.user_id === session.user.id && ['owner', 'admin'].includes(member.role))) && <section className="workspace-management"><div className="section-title"><div><p className="eyebrow">ESTRUTURA DA OPERAÇÃO</p><h2>Times</h2></div><span className="count">{workspaces.length}</span></div>
          {workspaces.length ? <div className="workspace-list">{workspaces.map(w=><article className="workspace-card workspace-card-clickable" key={w.id} role="button" tabIndex={0} onClick={()=>{setSelectedWorkspace(w.id);setTeamClientsWorkspace(w.id);}} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelectedWorkspace(w.id);document.getElementById('client-management')?.scrollIntoView({behavior:'smooth',block:'start'});}}}><span className="workspace-icon">▦</span><div className="workspace-info"><strong>{w.name}</strong><span>/{w.slug}</span></div><span className="workspace-status">{clients.filter(c=>c.workspace_id===w.id).length} clientes · {projects.filter(p=>p.workspace_id===w.id).length} projetos</span></article>)}</div> : <div className="empty-state"><span className="empty-icon">▦</span><strong>Crie seu primeiro workspace</strong><p>Um espaço para reunir projetos e tarefas da sua equipe.</p></div>}
          <div className="member-management">
            <div className="section-title"><div><p className="eyebrow">ACESSOS</p><h3>Membros e permissões</h3></div><span className="count">{teamMembers.length} vínculos</span></div>
            <p className="muted">Convide pessoas pelo e-mail ou adicione quem já tem conta. O acesso ao time é concedido automaticamente; convites novos chegam por e-mail.</p>
            {workspaces.map(workspace => {
              const members = teamMembers.filter(member => member.workspace_id === workspace.id);
              const canManageMembers = isPlatformAdmin || members.some(member => member.user_id === session?.user.id && ['owner', 'admin'].includes(member.role));
              return <section className="member-workspace" key={workspace.id}>
                <h4>{workspace.name}</h4>
                {canManageMembers && <form className="member-add-form" onSubmit={event => { event.preventDefault(); void addWorkspaceMember(workspace.id); }}>
                  <div className="field"><label htmlFor={`member-email-${workspace.id}`}>E-mail da pessoa</label><input id={`member-email-${workspace.id}`} type="email" value={memberEmailDrafts[workspace.id] || ''} onChange={event => setMemberEmailDrafts(current => ({ ...current, [workspace.id]: event.target.value }))} placeholder="pessoa@empresa.com" autoComplete="off" required /></div>
                  <div className="field"><label htmlFor={`member-role-${workspace.id}`}>Acesso inicial</label><select id={`member-role-${workspace.id}`} value={memberRoleDrafts[workspace.id] || 'analyst'} onChange={event => setMemberRoleDrafts(current => ({ ...current, [workspace.id]: event.target.value as 'owner' | 'admin' | 'analyst' | 'member' | 'viewer' }))}>{isPlatformAdmin && <><option value="owner">Proprietário do time</option><option value="admin">Administrador do time</option></>}<option value="analyst">Analista</option><option value="member">Membro</option><option value="viewer">Visualizador</option></select></div>
                  <button type="submit" className="button button-primary" disabled={busy || !(memberEmailDrafts[workspace.id] || '').trim()}>{busy ? 'Enviando…' : 'Convidar para o time'} ↗</button>
                  <p className="muted">Se já tiver conta, a pessoa será adicionada na hora. Se for nova, receberá um convite por e-mail.</p>
                </form>}
                {members.length ? members.map(member => {
                  const profile = profiles.find(item => item.id === member.user_id);
                  const isSelf = member.user_id === session?.user.id;
                  const isLastOwner = member.role === 'owner' && members.filter(item => item.role === 'owner').length <= 1;
                  return <div className="member-row" key={member.workspace_id + member.user_id}>
                    <div className="member-identity"><span className="assignee-avatar">{(profile?.display_name || member.user_id).slice(0,1).toUpperCase()}</span><div><strong>{profile?.display_name || (isSelf ? session?.user.email : null) || 'Membro da equipe'}{isSelf ? ' (você)' : ''}</strong><small>{member.user_id.slice(0,8)}…</small></div></div>
                    <select aria-label={`Permissão de ${profile?.display_name || member.user_id}`} value={member.role} disabled={busy || !canManageMembers || isLastOwner} onChange={event => void updateMemberRole(member,event.target.value)}>{isPlatformAdmin && <><option value="owner">Proprietário do time</option><option value="admin">Administrador do time</option></>}<option value="analyst">Analista</option><option value="member">Membro</option><option value="viewer">Visualizador</option></select>
                    <button type="button" className="text-button danger-text" disabled={busy || !canManageMembers || isSelf || isLastOwner} onClick={() => void removeMember(member)}>Remover</button>
                  </div>;
                }) : <div className="empty-state compact-empty"><strong>Este time ainda não tem membros</strong><p>{isPlatformAdmin ? "Como administrador geral, você não entra automaticamente nos times. Convide uma pessoa e selecione “Proprietário do time” para definir quem será responsável por esta equipe." : "Adicione o primeiro membro para começar a colaborar neste time."}</p></div>}
              </section>;
            })}
          </div>
          <form className="workspace-form" onSubmit={createWorkspace}><label htmlFor="workspace-name">Criar time</label><div className="form-row"><input id="workspace-name" value={workspaceName} onChange={e=>setWorkspaceName(e.target.value)} placeholder="Ex.: Time de Produto, Atendimento, Design" maxLength={120} required/><button className="button button-primary" disabled={busy}>{busy?'Criando…':'Criar time'} ↗</button></div></form>
        </section>}
        {teamClientsWorkspace && <div className="issue-modal-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setTeamClientsWorkspace(null);}}>
          <section className="team-clients-modal" role="dialog" aria-modal="true" aria-labelledby="team-clients-title">
            <header className="issue-modal-header"><div><p className="eyebrow">ESTRUTURA DO TIME</p><h2 id="team-clients-title">{workspaces.find(w=>w.id===teamClientsWorkspace)?.name ?? 'Time'}</h2><p className="muted">Clientes vinculados a este time e seus projetos.</p></div><button type="button" className="button button-quiet" onClick={()=>setTeamClientsWorkspace(null)}>Fechar ✕</button></header>
            <div className="team-clients-list">{clients.filter(client=>client.workspace_id===teamClientsWorkspace).map(client=><article className="team-client-detail" key={client.id}><div className="client-mark">{client.name.slice(0,1).toUpperCase()}</div><div className="team-client-detail-copy"><strong>{client.name}</strong><small>{client.description||'Sem descrição'}</small><div className="team-client-projects">{projects.filter(project=>project.client_id===client.id).map(project=><button type="button" className="team-project-link" key={project.id} onClick={()=>openProject(project.id)}><span>{project.key}</span>{project.name} ↗</button>)}{!projects.some(project=>project.client_id===client.id)&&<small>Este cliente ainda não tem projetos.</small>}</div></div><button type="button" className="text-button" onClick={()=>{setIssueClientFilter(client.id);setIssueProjectFilter('all');setTeamClientsWorkspace(null);document.getElementById('task-management')?.scrollIntoView({behavior:'smooth',block:'start'});}}>Ver tarefas ↗</button></article>)}
            {!clients.some(client=>client.workspace_id===teamClientsWorkspace)&&<div className="empty-state compact-empty"><strong>Nenhum cliente neste time ainda</strong><p>Feche esta janela e use a seção Clientes para cadastrar o primeiro.</p></div>}
          </div>
          </section>
        </div>}
        {selectedIssue && <div className="issue-modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedIssue(null); }}>
          <section className="issue-modal" role="dialog" aria-modal="true" aria-labelledby="issue-modal-title">
            <header className="issue-modal-header"><div><p className="eyebrow">DETALHES DA TAREFA</p><h2 id="issue-modal-title">{selectedIssue.title}</h2><p className="muted">{projects.find(p => p.id === selectedIssue.project_id)?.key ?? 'TASK'}-{selectedIssue.issue_number} · {({epic:'Épico',story:'História',task:'Tarefa',bug:'Bug',subtask:'Subtarefa'} as Record<string,string>)[selectedIssue.type] ?? 'Tarefa'}</p></div><div className="issue-modal-header-actions"><button type="button" className="button button-quiet" onClick={() => { startEditingIssue(selectedIssue); setSelectedIssue(null); }}>Editar tarefa</button><button type="button" className="text-button" onClick={() => setSelectedIssue(null)}>Fechar ✕</button></div></header>
            {selectedIssue.description && <p className="issue-modal-description">{selectedIssue.description}</p>}
            <div className="comments-list">
              {commentsLoading ? <p className="muted">Carregando comentários…</p> : issueComments.length ? issueComments.map(comment => <article className="comment-item" key={comment.id}><div className="comment-avatar">{comment.author_id === session?.user.id ? 'V' : 'M'}</div><div className="comment-content"><div className="comment-meta"><strong>{comment.author_id === session?.user.id ? 'Você' : 'Membro da equipe'}</strong><time>{new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(comment.created_at))}</time></div><p>{comment.body}</p></div></article>) : <div className="kanban-empty">Nenhum comentário ainda. Comece a conversa.</div>}
            </div>
            <form className="comment-form" onSubmit={addIssueComment}><label htmlFor="comment-draft">Adicionar comentário</label><textarea id="comment-draft" value={commentDraft} onChange={event => setCommentDraft(event.target.value)} placeholder="Compartilhe uma atualização ou dúvida…" rows={3} maxLength={10000} required/><button className="button button-primary" disabled={busy || !commentDraft.trim()}>{busy ? 'Enviando…' : 'Publicar comentário'} ↗</button></form>
          </section>
        </div>}
        {error && <p className="feedback feedback-error" role="alert">{error}</p>}{message && <p className="feedback feedback-success" role="status">{message}</p>}
      </div> : <div className="auth-layout">
        <div className="auth-intro"><p className="eyebrow">UM ESPAÇO PARA FAZER ACONTECER</p><h2>Menos ruído.<br/><span>Mais movimento.</span></h2><p>Seu ponto de partida para projetos mais claros, equipes alinhadas e entregas consistentes.</p><div className="feature-line"><span>01</span><div><strong>Organização que escala</strong><small>Workspaces para cada equipe e iniciativa.</small></div></div><div className="feature-line"><span>02</span><div><strong>Progresso visível</strong><small>Um caminho claro do plano à entrega.</small></div></div></div>
        <div className="auth-card"><div className="auth-tabs"><button className={mode==='login'?'active':''} onClick={()=>{setMode('login');setError('');setMessage('');}}>Entrar</button><button className={mode==='signup'?'active':''} onClick={()=>{setMode('signup');setError('');setMessage('');}}>Criar conta</button></div><h2>{mode==='login'?'Bem-vindo de volta':'Comece por aqui'}</h2><p className="muted">{mode==='login'?'Entre para acessar seus workspaces.':'Crie sua conta para abrir seu primeiro workspace.'}</p>
          <form className="auth-form" onSubmit={authenticate}>{mode==='signup'&&<div className="field"><label htmlFor="display-name">Como podemos chamar você?</label><input id="display-name" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Seu nome" autoComplete="name" maxLength={80} required/></div>}<div className="field"><label htmlFor="email">E-mail</label><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@empresa.com" autoComplete="email" required/></div><div className="field"><label htmlFor="password">Senha</label><input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete={mode==='login'?'current-password':'new-password'} minLength={8} required/></div>{error&&<p className="feedback feedback-error" role="alert">{error}</p>}{message&&<p className="feedback feedback-success" role="status">{message}</p>}<button className="button button-primary button-full" disabled={busy||!isSupabaseConfigured}>{busy?'Aguarde…':mode==='login'?'Entrar na plataforma':'Criar minha conta'} ↗</button></form><p className="auth-foot">Acesse seu ambiente de trabalho com segurança.</p></div>
      </div>}
    </section><footer className="footer"><span>LOCK PROJECT <span className="footer-dot">●</span> © 2026</span><span>Clareza para o trabalho em equipe.</span></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
