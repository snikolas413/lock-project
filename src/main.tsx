import { FormEvent, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './lib/supabase';
import './styles.css';

type Workspace = { id: string; name: string; slug: string; created_at: string };

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
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
    if (!session) { setWorkspaces([]); return; }
    void loadWorkspaces();
  }, [session]);

  async function loadWorkspaces() {
    const { data, error } = await supabase.from('workspaces').select('id,name,slug,created_at').order('created_at', { ascending: false });
    if (error) setError(error.message); else setWorkspaces(data ?? []);
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

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) setError(error.message);
  }

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="#"><span className="brand-mark">L</span><span>lock<span className="brand-light">project</span></span></a><span className="topbar-note">Seu trabalho, com direção.</span>{session && <button className="button button-quiet" onClick={signOut}>Sair</button>}</header>
    {!isSupabaseConfigured && <div className="notice"><strong>Configuração pendente</strong><span>Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env local para habilitar a autenticação.</span></div>}
    <section className="hero"><p className="eyebrow"><span className="eyebrow-dot"/> WORKSPACE PARA IDEIAS EM MOVIMENTO</p><h1>Do primeiro rascunho<br/>à <span>entrega final.</span></h1><p className="hero-copy">Organize projetos, reúna seu time e transforme trabalho disperso em progresso visível.</p></section>
    <section className="content-panel">
      {!ready ? <div className="loading">Preparando seu espaço…</div> : session ? <div className="dashboard">
        <div className="section-heading"><div><p className="eyebrow">SEU AMBIENTE</p><h2>Vamos construir algo.</h2><p className="muted">Crie um workspace para começar a organizar o trabalho.</p></div><span className="avatar">{(session.user.email?.[0] ?? 'L').toUpperCase()}</span></div>
        <form className="workspace-form" onSubmit={createWorkspace}><label htmlFor="workspace-name">Novo workspace</label><div className="form-row"><input id="workspace-name" value={workspaceName} onChange={e=>setWorkspaceName(e.target.value)} placeholder="Ex.: Produto, Marketing, Minha equipe" maxLength={120} required/><button className="button button-primary" disabled={busy}>{busy?'Criando…':'Criar workspace'} ↗</button></div></form>
        <div className="list-heading"><h3>Workspaces</h3><span className="count">{workspaces.length}</span></div>
        {workspaces.length ? <div className="workspace-list">{workspaces.map(w=><article className="workspace-card" key={w.id}><span className="workspace-icon">▦</span><div className="workspace-info"><strong>{w.name}</strong><span>/{w.slug}</span></div><span className="workspace-status">Ativo</span></article>)}</div> : <div className="empty-state"><span className="empty-icon">▦</span><strong>Seu primeiro espaço começa aqui</strong><p>Crie um workspace para organizar projetos e tarefas em um só lugar.</p></div>}
        {error && <p className="feedback feedback-error">{error}</p>}{message && <p className="feedback feedback-success">{message}</p>}
      </div> : <div className="auth-layout">
        <div className="auth-intro"><p className="eyebrow">UM ESPAÇO PARA FAZER ACONTECER</p><h2>Menos ruído.<br/><span>Mais movimento.</span></h2><p>Seu ponto de partida para projetos mais claros, equipes alinhadas e entregas consistentes.</p><div className="feature-line"><span>01</span><div><strong>Organização que escala</strong><small>Workspaces para cada equipe e iniciativa.</small></div></div><div className="feature-line"><span>02</span><div><strong>Progresso visível</strong><small>Um caminho claro do plano à entrega.</small></div></div></div>
        <div className="auth-card"><div className="auth-tabs"><button className={mode==='login'?'active':''} onClick={()=>{setMode('login');setError('');setMessage('');}}>Entrar</button><button className={mode==='signup'?'active':''} onClick={()=>{setMode('signup');setError('');setMessage('');}}>Criar conta</button></div><h2>{mode==='login'?'Bem-vindo de volta':'Comece por aqui'}</h2><p className="muted">{mode==='login'?'Entre para acessar seus workspaces.':'Crie sua conta para abrir seu primeiro workspace.'}</p>
          <form className="auth-form" onSubmit={authenticate}>{mode==='signup'&&<div className="field"><label htmlFor="display-name">Como podemos chamar você?</label><input id="display-name" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Seu nome" autoComplete="name" maxLength={80} required/></div>}<div className="field"><label htmlFor="email">E-mail</label><input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@empresa.com" autoComplete="email" required/></div><div className="field"><label htmlFor="password">Senha</label><input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mínimo de 8 caracteres" autoComplete={mode==='login'?'current-password':'new-password'} minLength={8} required/></div>{error&&<p className="feedback feedback-error" role="alert">{error}</p>}{message&&<p className="feedback feedback-success" role="status">{message}</p>}<button className="button button-primary button-full" disabled={busy||!isSupabaseConfigured}>{busy?'Aguarde…':mode==='login'?'Entrar na plataforma':'Criar minha conta'} ↗</button></form><p className="auth-foot">Acesse seu ambiente de trabalho com segurança.</p></div>
      </div>}
    </section><footer className="footer"><span>LOCK PROJECT <span className="footer-dot">●</span> © 2026</span><span>Clareza para o trabalho em equipe.</span></footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App/>);
