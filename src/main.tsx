import { FormEvent, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import './styles.css';

type Workspace = { id: string; name: string; slug: string; created_at: string };
type Project = { id: string; name: string; key: string; description: string | null; status: string; workspace_id: string; updated_at: string };
type Issue = { id: string; title: string; issue_number: number; status: string; priority: string; updated_at: string; project_id: string; due_date: string | null };

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskProject, setTaskProject] = useState('');
  const [taskStatus, setTaskStatus] = useState('backlog');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    if (!session) { setWorkspaces([]); setProjects([]); setIssues([]); return; }
    void loadWorkspaces();
  }, [session]);

  async function loadWorkspaces() {
    const { data, error } = await supabase.from('workspaces').select('id,name,slug,created_at').order('created_at', { ascending: false });
    if (error) { setError(error.message); return; }
    const nextWorkspaces = (data ?? []) as Workspace[];
    setWorkspaces(nextWorkspaces);
    setSelectedWorkspace(current => current && nextWorkspaces.some(w => w.id === current) ? current : (nextWorkspaces[0]?.id ?? ''));
    if (!nextWorkspaces.length) { setProjects([]); setIssues([]); return; }
    const { data: projectData, error: projectError } = await supabase.from('projects').select('id,name,key,description,status,workspace_id,updated_at').in('workspace_id', nextWorkspaces.map(w => w.id)).order('updated_at', { ascending: false });
    if (projectError) { setError(projectError.message); return; }
    const nextProjects = (projectData ?? []) as Project[];
    setProjects(nextProjects);
    if (!nextProjects.length) { setIssues([]); return; }
    const { data: issueData, error: issueError } = await supabase.from('issues').select('id,title,issue_number,status,priority,updated_at,project_id,due_date').in('project_id', nextProjects.map(p => p.id)).order('updated_at', { ascending: false });
    if (issueError) setError(issueError.message);
    else setIssues((issueData ?? []) as Issue[]);
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

  async function createWorkspace(event: FormEvent) {
    event.preventDefault(); if (!session?.user) return;
    const name = workspaceName.trim(); if (!name) return;
    const slug = name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'workspace';
    setBusy(true); setError(''); setMessage('');
    const { error } = await supabase.from('workspaces').insert({ name, slug, created_by: session.user.id });
    if (error) setError(error.message);
    else { setWorkspaceName(''); setMessage('Workspace criado com sucesso.'); await loadWorkspaces(); }
    setBusy(false);
  }

  async function saveIssue(event: FormEvent) {
    event.preventDefault();
    const projectId = taskProject || projects[0]?.id;
    if (!session?.user || !projectId || !taskTitle.trim()) return;
    setBusy(true); setError(''); setMessage('');
    const payload = {
      title: taskTitle.trim(),
      project_id: projectId,
      status: taskStatus,
      priority: taskPriority,
      due_date: taskDueDate || null,
    };
    const result = editingIssueId
      ? await supabase.from('issues').update(payload).eq('id', editingIssueId)
      : await supabase.from('issues').insert({ ...payload, reporter_id: session.user.id });
    if (result.error) setError(result.error.message);
    else {
      setTaskTitle(''); setTaskDueDate(''); setTaskStatus('backlog'); setTaskPriority('medium');
      setEditingIssueId(null); setMessage(editingIssueId ? 'Tarefa atualizada.' : 'Tarefa criada com sucesso.');
      await loadWorkspaces();
    }
    setBusy(false);
  }

  function startEditingIssue(issue: Issue) {
    setEditingIssueId(issue.id);
    setTaskTitle(issue.title);
    setTaskProject(issue.project_id);
    setTaskStatus(issue.status);
    setTaskPriority(issue.priority);
    setTaskDueDate(issue.due_date ?? '');
    setError(''); setMessage('');
    document.getElementById('task-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">L</span><span>lock<span className="brand-light">project</span></span></a><span className="topbar-note">Seu trabalho, com direção.</span>{session && <button className="button button-quiet" onClick={signOut}>Sair</button>}</header>
    {!isSupabaseConfigured && <div className="notice"><strong>Configuração pendente</strong><span>Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env local para habilitar a autenticação.</span></div>}
    <section className="hero"><p className="eyebrow"><span className="eyebrow-dot"/> WORKSPACE PARA IDEIAS EM MOVIMENTO</p><h1>Do primeiro rascunho<br/>à <span>entrega final.</span></h1><p className="hero-copy">Organize projetos, reúna seu time e transforme trabalho disperso em progresso visível.</p></section>
    <section className="content-panel">
      {!ready ? <div className="loading">Preparando seu espaço…</div> : session ? <div className="dashboard dashboard-home">
        <div className="dashboard-heading"><div><p className="eyebrow"><span className="eyebrow-dot"/> VISÃO GERAL</p><h1>Bom te ver, {session.user.user_metadata?.display_name || session.user.email?.split('@')[0] || 'por aí'}.</h1><p className="muted">Aqui está um panorama do que está acontecendo nos seus espaços.</p></div><span className="avatar">{(session.user.email?.[0] ?? 'L').toUpperCase()}</span></div>
        <div className="stats-grid">
          <article className="stat-card"><span className="stat-icon">▦</span><span className="stat-label">Workspaces</span><strong>{workspaces.length}</strong><small>Seus espaços de trabalho</small></article>
          <article className="stat-card"><span className="stat-icon">◇</span><span className="stat-label">Projetos</span><strong>{projects.length}</strong><small>Iniciativas organizadas</small></article>
          <article className="stat-card"><span className="stat-icon">◷</span><span className="stat-label">Tarefas abertas</span><strong>{issues.filter(i => !['done','completed','closed','concluido','concluído'].includes(i.status.toLowerCase())).length}</strong><small>Precisam de atenção</small></article>
          <article className="stat-card"><span className="stat-icon">✓</span><span className="stat-label">Concluídas</span><strong>{issues.filter(i => ['done','completed','closed','concluido','concluído'].includes(i.status.toLowerCase())).length}</strong><small>De {issues.length} tarefas</small></article>
        </div>
        <div className="dashboard-columns">
          <section className="dashboard-section"><div className="section-title"><div><p className="eyebrow">SEUS PROJETOS</p><h2>Projetos recentes</h2></div><span className="count">{projects.length}</span></div>
            {projects.length ? <div className="project-list">{projects.slice(0,6).map(p=><article className="project-row" key={p.id}><span className="project-mark">{p.key.slice(0,2)}</span><div className="project-copy"><strong>{p.name}</strong><span>{p.key} · {p.status}</span></div><span className="project-status">Ativo</span></article>)}</div> : <div className="empty-state compact-empty"><span className="empty-icon">◇</span><strong>Seu primeiro projeto começa aqui</strong><p>Crie um projeto para reunir tarefas e acompanhar as entregas.</p></div>}
            <form className="create-project-form" onSubmit={async event => {
              event.preventDefault();
              if (!session?.user || !workspaces.length || !projectName.trim()) return;
              setBusy(true); setError(''); setMessage('');
              const base = projectName.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'').slice(0,5) || 'PROJ';
              const { error } = await supabase.from('projects').insert({name:projectName.trim(),key:base+Date.now().toString().slice(-4),description:projectDescription.trim()||null,workspace_id:selectedWorkspace||workspaces[0].id,created_by:session.user.id});
              if(error) setError(error.message); else {setProjectName('');setProjectDescription('');setMessage('Projeto criado com sucesso.'); await loadWorkspaces();}
              setBusy(false);
            }}><div className="section-title"><div><p className="eyebrow">NOVO PROJETO</p><h2>Comece uma iniciativa</h2></div></div>
              {workspaces.length ? <><div className="field"><label htmlFor="project-workspace">Workspace</label><select id="project-workspace" value={selectedWorkspace || workspaces[0].id} onChange={e=>setSelectedWorkspace(e.target.value)}>{workspaces.map(w=><option value={w.id} key={w.id}>{w.name}</option>)}</select></div><div className="field"><label htmlFor="project-name">Nome do projeto</label><input id="project-name" value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="Ex.: Redesign do produto" maxLength={100} required/></div><div className="field"><label htmlFor="project-description">Descrição <span className="optional">(opcional)</span></label><textarea id="project-description" value={projectDescription} onChange={e=>setProjectDescription(e.target.value)} placeholder="Qual é o objetivo deste projeto?" rows={2} maxLength={500}/></div><button className="button button-primary" disabled={busy||!projectName.trim()}>{busy?'Criando…':'Criar projeto'} ↗</button></> : <p className="muted">Crie um workspace abaixo antes de adicionar projetos.</p>}
            </form>
          </section>
          <section className="dashboard-section"><div className="section-title"><div><p className="eyebrow">ACOMPANHAMENTO</p><h2>Atividade recente</h2></div><span className="count">{issues.length}</span></div>
            {issues.length ? <div className="activity-list">{issues.slice(0,7).map(i=><article className="activity-row" key={i.id}><span className="issue-dot">•</span><div className="activity-copy"><strong>{i.title}</strong><span>{projects.find(p=>p.id===i.project_id)?.key ?? 'TASK'}-{i.issue_number}</span><small>{i.status.replace(/_/g,' ')} · {new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(i.updated_at))}</small></div><span className={'priority priority-'+i.priority.toLowerCase()}>{i.priority}</span></article>)}</div> : <div className="empty-state compact-empty"><span className="empty-icon">◷</span><strong>Sem atividade por enquanto</strong><p>As tarefas recentes vão aparecer aqui quando você começar a trabalhar nos projetos.</p></div>}
            <div className="progress-card"><div className="progress-top"><div><span className="stat-label">Progresso geral</span><strong>{issues.length ? Math.round(issues.filter(i=>['done','completed','closed','concluido','concluído'].includes(i.status.toLowerCase())).length/issues.length*100):0}%</strong></div><span className="progress-check">✓</span></div><div className="progress-track"><span style={{width:(issues.length?issues.filter(i=>['done','completed','closed','concluido','concluído'].includes(i.status.toLowerCase())).length/issues.length*100:0)+'%'}}/></div><p>{issues.filter(i=>['done','completed','closed','concluido','concluído'].includes(i.status.toLowerCase())).length} de {issues.length} tarefas concluídas</p></div>
          </section>
        </div>
        <section className="task-management">
          <div className="section-title"><div><p className="eyebrow">EXECUÇÃO</p><h2>Gerenciar tarefas</h2></div><span className="count">{issues.length} tarefas</span></div>
          <form id="task-form" className="task-form" onSubmit={saveIssue}>
            <div className="task-form-heading"><strong>{editingIssueId ? 'Editar tarefa' : 'Nova tarefa'}</strong>{editingIssueId && <button type="button" className="text-button" onClick={() => { setEditingIssueId(null); setTaskTitle(''); setTaskDueDate(''); setTaskStatus('backlog'); setTaskPriority('medium'); }}>Cancelar edição</button>}</div>
            <div className="task-form-grid">
              <div className="field task-title-field"><label htmlFor="task-title">Título da tarefa</label><input id="task-title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Ex.: Revisar fluxo de cadastro" maxLength={240} required /></div>
              <div className="field"><label htmlFor="task-project">Projeto</label><select id="task-project" value={taskProject || projects[0]?.id || ''} onChange={e => setTaskProject(e.target.value)} required disabled={!projects.length}>{projects.map(p => <option key={p.id} value={p.id}>{p.key} · {p.name}</option>)}</select></div>
              <div className="field"><label htmlFor="task-status">Status</label><select id="task-status" value={taskStatus} onChange={e => setTaskStatus(e.target.value)}><option value="backlog">Backlog</option><option value="todo">A fazer</option><option value="in_progress">Em andamento</option><option value="in_review">Em revisão</option><option value="done">Concluída</option><option value="cancelled">Cancelada</option></select></div>
              <div className="field"><label htmlFor="task-priority">Prioridade</label><select id="task-priority" value={taskPriority} onChange={e => setTaskPriority(e.target.value)}><option value="lowest">Mínima</option><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="highest">Urgente</option></select></div>
              <div className="field"><label htmlFor="task-due-date">Prazo <span className="optional">(opcional)</span></label><input id="task-due-date" type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} /></div>
            </div>
            <button className="button button-primary" disabled={busy || !projects.length || !taskTitle.trim()}>{busy ? 'Salvando…' : editingIssueId ? 'Salvar alterações' : 'Criar tarefa'} ↗</button>
            {!projects.length && <p className="muted">Crie um projeto antes de cadastrar tarefas.</p>}
          </form>
          <div className="task-table">
            <div className="task-table-head"><span>Tarefa</span><span>Status</span><span>Prioridade</span><span>Prazo</span><span>Ações</span></div>
            {issues.length ? issues.map(issue => <article className="task-table-row" key={issue.id}>
              <div className="task-name"><strong>{issue.title}</strong><small>{projects.find(p => p.id === issue.project_id)?.key ?? 'TASK'}-{issue.issue_number}</small></div>
              <select aria-label={`Status de ${issue.title}`} value={issue.status} disabled={busy} onChange={async e => { setBusy(true); setError(''); const { error } = await supabase.from('issues').update({ status: e.target.value }).eq('id', issue.id); if (error) setError(error.message); else await loadWorkspaces(); setBusy(false); }}><option value="backlog">Backlog</option><option value="todo">A fazer</option><option value="in_progress">Em andamento</option><option value="in_review">Em revisão</option><option value="done">Concluída</option><option value="cancelled">Cancelada</option></select>
              <select aria-label={`Prioridade de ${issue.title}`} value={issue.priority} disabled={busy} onChange={async e => { setBusy(true); setError(''); const { error } = await supabase.from('issues').update({ priority: e.target.value }).eq('id', issue.id); if (error) setError(error.message); else await loadWorkspaces(); setBusy(false); }}><option value="lowest">Mínima</option><option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="highest">Urgente</option></select>
              <span className="task-due">{issue.due_date ? new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(new Date(issue.due_date+'T00:00:00Z')) : 'Sem prazo'}</span>
              <div className="task-actions"><button type="button" className="text-button" onClick={() => startEditingIssue(issue)}>Editar</button><button type="button" className="text-button danger-text" disabled={busy} onClick={() => void deleteIssue(issue)}>Excluir</button></div>
            </article>) : <div className="empty-state compact-empty"><span className="empty-icon">◷</span><strong>Nenhuma tarefa ainda</strong><p>Cadastre uma tarefa acima para acompanhar status, prioridade e prazo.</p></div>}
          </div>
        </section>
        <section className="workspace-management"><div className="section-title"><div><p className="eyebrow">SEUS AMBIENTES</p><h2>Workspaces</h2></div><span className="count">{workspaces.length}</span></div>
          {workspaces.length ? <div className="workspace-list">{workspaces.map(w=><article className="workspace-card" key={w.id}><span className="workspace-icon">▦</span><div className="workspace-info"><strong>{w.name}</strong><span>/{w.slug}</span></div><span className="workspace-status">{projects.filter(p=>p.workspace_id===w.id).length} projetos</span></article>)}</div> : <div className="empty-state"><span className="empty-icon">▦</span><strong>Crie seu primeiro workspace</strong><p>Um espaço para reunir projetos e tarefas da sua equipe.</p></div>}
          <form className="workspace-form" onSubmit={createWorkspace}><label htmlFor="workspace-name">Criar workspace</label><div className="form-row"><input id="workspace-name" value={workspaceName} onChange={e=>setWorkspaceName(e.target.value)} placeholder="Ex.: Produto, Marketing, Minha equipe" maxLength={120} required/><button className="button button-primary" disabled={busy}>{busy?'Criando…':'Criar workspace'} ↗</button></div></form>
        </section>
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
