
import React, { useMemo } from 'react';

type Project = { id: string; name: string; key: string; status: string; updated_at: string };
type Issue = { id: string; title: string; issue_number: number; type: string; parent_issue_id: string | null; status: string; priority: string; updated_at: string; project_id: string; due_date: string | null; assignee_id: string | null };
type Profile = { id: string; display_name: string | null };
type Dependency = { id: string; predecessor_id: string; successor_id: string; created_at: string };
type Props = { projects: Project[]; issues: Issue[]; profiles: Profile[]; dependencies: Dependency[]; onOpenIssue: (issue: Issue) => void; onOpenProject: (id: string) => void };
const done = (s: string) => ['done','completed','closed','concluido','concluído'].includes(s.toLowerCase());
const cancelled = (s: string) => ['cancelled','canceled','cancelado','cancelada'].includes(s.toLowerCase());
const day = (d = new Date()) => new Date(d.getFullYear(),d.getMonth(),d.getDate());
const dateOf = (s: string) => new Date(s.length === 10 ? s+'T00:00:00' : s);
const diffDays = (a: Date,b: Date) => Math.floor((day(b).getTime()-day(a).getTime())/86400000);
const fmtDate = (s: string) => new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(dateOf(s));

export function OverviewInsights({projects,issues,profiles,dependencies,onOpenIssue,onOpenProject}: Props) {
 const today=day();
 const tasks=issues.filter(i=>!cancelled(i.status)&&i.type!=='milestone');
 const leaves=tasks.filter(i=>!tasks.some(child=>child.parent_issue_id===i.id));
 const tracked=leaves.length?leaves:tasks;
 const open=tracked.filter(i=>!done(i.status));
 const completed=tracked.filter(i=>done(i.status));
 const overdue=open.filter(i=>i.due_date&&diffDays(dateOf(i.due_date),today)>0).sort((a,b)=>(a.due_date||'').localeCompare(b.due_date||''));
 const soon=open.filter(i=>i.due_date&&diffDays(today,dateOf(i.due_date))>=0&&diffDays(today,dateOf(i.due_date))<=7).sort((a,b)=>(a.due_date||'').localeCompare(b.due_date||''));
 const blockedIds=new Set(dependencies.filter(d=>{const p=issues.find(i=>i.id===d.predecessor_id),s=issues.find(i=>i.id===d.successor_id);return p&&s&&!done(p.status)&&!cancelled(p.status)&&!done(s.status)&&!cancelled(s.status)}).map(d=>d.successor_id));
 const blocked=open.filter(i=>blockedIds.has(i.id));
 const stats=projects.map(p=>{const list=tracked.filter(i=>i.project_id===p.id),n=list.filter(i=>done(i.status)).length,last=list.reduce((v,i)=>!v||i.updated_at>v?i.updated_at:v,'')||p.updated_at;return {...p,total:list.length,done:n,pct:list.length?Math.round(n/list.length*100):0,late:overdue.filter(i=>i.project_id===p.id).length,stale:diffDays(dateOf(last),today)}});
 const risk=stats.filter(p=>p.late>0||p.stale>=14).sort((a,b)=>b.late-a.late||b.stale-a.stale);
 const recent=completed.filter(i=>diffDays(dateOf(i.updated_at),today)>=0&&diffDays(dateOf(i.updated_at),today)<30);
 const bars=Array.from({length:6},(_,n)=>{const end=new Date(today);end.setDate(end.getDate()-(5-n)*5);const start=new Date(end);start.setDate(start.getDate()-4);return {label:new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(start),value:recent.filter(i=>dateOf(i.updated_at)>=start&&dateOf(i.updated_at)<=new Date(end.getFullYear(),end.getMonth(),end.getDate(),23,59,59)).length}});
 const maxBar=Math.max(1,...bars.map(b=>b.value));
 const workload=useMemo(()=>{const map=new Map<string,{id:string,name:string,total:number,late:number}>();open.forEach(i=>{const id=i.assignee_id||'none',p=profiles.find(x=>x.id===id),v=map.get(id)||{id,name:p?.display_name||(id==='none'?'Sem responsável':'Usuário'),total:0,late:0};v.total++;if(i.due_date&&diffDays(dateOf(i.due_date),today)>0)v.late++;map.set(id,v)});return [...map.values()].sort((a,b)=>b.late-a.late||b.total-a.total).slice(0,5)},[issues,profiles]);
 const row=(i:Issue,kind:'late'|'soon'|'blocked')=><button className="overview-alert-row" type="button" key={i.id} onClick={()=>onOpenIssue(i)}><span className={'overview-alert-symbol '+kind}>{kind==='late'?'!':kind==='soon'?'◷':'↗'}</span><span className="overview-alert-copy"><strong>{i.title}</strong><small>{projects.find(p=>p.id===i.project_id)?.key||'Tarefa'} · {i.assignee_id?profiles.find(p=>p.id===i.assignee_id)?.display_name||'Responsável definido':'Sem responsável'}</small></span><span className="overview-alert-date">{i.due_date?fmtDate(i.due_date):'Bloqueada'}{kind==='late'&&i.due_date?<small>{diffDays(dateOf(i.due_date),today)} dias</small>:null}</span></button>;
 return <section className="overview-insights">
  <div className="overview-kpis">
   <article><span>Projetos ativos</span><strong>{projects.filter(p=>!['done','completed','closed','cancelled','archived'].includes(p.status.toLowerCase())).length}</strong><small>{projects.length} no total</small></article>
   <article className={overdue.length?'danger':''}><span>Tarefas atrasadas</span><strong>{overdue.length}</strong><small>Precisam de atenção</small></article>
   <article className={risk.length?'warning':''}><span>Projetos em risco</span><strong>{risk.length}</strong><small>Atrasos ou 14+ dias sem atividade</small></article>
   <article><span>Vencem em 7 dias</span><strong>{soon.length}</strong><small>Entregas próximas</small></article>
  </div>
  <div className="overview-insights-grid">
   <section className="overview-panel"><div className="overview-panel-heading"><div><p className="eyebrow">PORTFÓLIO</p><h2>Progresso atual dos projetos</h2><p>Percentual de tarefas concluídas.</p></div></div>
    {stats.length?<div className="overview-project-list">{[...stats].sort((a,b)=>a.pct-b.pct).slice(0,8).map(p=><button type="button" key={p.id} onClick={()=>onOpenProject(p.id)}><span><strong>{p.name}</strong><small>{p.key} · {p.done}/{p.total} tarefas</small></span><span className="overview-progress-track"><i style={{width:p.pct+'%'}}/></span><b>{p.pct}%</b></button>)}</div>:<p className="overview-empty">Cadastre projetos e tarefas para acompanhar o progresso.</p>}
    <p className="overview-note">O histórico real de evolução ainda não é armazenado. Este painel mostra o progresso atual sem inventar dados históricos.</p>
   </section>
   <section className="overview-panel"><div className="overview-panel-heading"><div><p className="eyebrow">AÇÃO IMEDIATA</p><h2>Tarefas atrasadas</h2><p>Itens abertos cujo prazo já passou.</p></div></div>{overdue.length?<div>{overdue.slice(0,6).map(i=>row(i,'late'))}</div>:<p className="overview-empty positive">✓ Nenhuma tarefa aberta com prazo vencido.</p>}</section>
   <section className="overview-panel"><div className="overview-panel-heading"><div><p className="eyebrow">RITMO DE ENTREGA</p><h2>Conclusões recentes</h2><p>Tarefas concluídas atualizadas nos últimos 30 dias.</p></div></div><div className="overview-bars" role="img" aria-label="Tarefas concluídas por período, com base na última atualização">{bars.map((b,n)=><div key={b.label+n}><b>{b.value}</b><span><i style={{height:Math.max(b.value?8:2,b.value/maxBar*100)+'%'}}/></span><small>{b.label}</small></div>)}</div><p className="overview-note">A última atualização não é necessariamente a data exata de conclusão. O gráfico é indicativo até existir histórico de mudanças.</p></section>
   <section className="overview-panel"><div className="overview-panel-heading"><div><p className="eyebrow">PRÓXIMOS PRAZOS</p><h2>Entregas dos próximos 7 dias</h2></div></div>{soon.length?<div>{soon.slice(0,6).map(i=>row(i,'soon'))}</div>:<p className="overview-empty">Nenhuma entrega com prazo próximo.</p>}</section>
   <section className="overview-panel"><div className="overview-panel-heading"><div><p className="eyebrow">SAÚDE DO PORTFÓLIO</p><h2>Projetos que precisam de atenção</h2><p>Com tarefas vencidas ou sem movimentação recente.</p></div></div>{risk.length?<div>{risk.slice(0,6).map(p=><button type="button" className="overview-alert-row" key={p.id} onClick={()=>onOpenProject(p.id)}><span className="overview-alert-symbol blocked">!</span><span className="overview-alert-copy"><strong>{p.name}</strong><small>{p.late?p.late+' tarefa(s) atrasada(s)':'Sem movimentação há '+p.stale+' dias'}</small></span><span className="overview-alert-date">{p.pct}%<small>progresso</small></span></button>)}</div>:<p className="overview-empty positive">✓ Nenhum projeto em risco pelos critérios atuais.</p>}</section>
   <section className="overview-panel"><div className="overview-panel-heading"><div><p className="eyebrow">DEPENDÊNCIAS</p><h2>Tarefas bloqueadas</h2><p>Aguardando a conclusão de uma tarefa anterior.</p></div></div>{blocked.length?<div>{blocked.slice(0,6).map(i=>row(i,'blocked'))}</div>:<p className="overview-empty positive">✓ Nenhum bloqueio identificado.</p>}</section>
   <section className="overview-panel"><div className="overview-panel-heading"><div><p className="eyebrow">CARGA DA EQUIPE</p><h2>Tarefas abertas por responsável</h2></div></div>{workload.length?<div className="overview-workload">{workload.map(p=><div key={p.id}><span><strong>{p.name}</strong><small>{p.total} abertas · {p.late} atrasadas</small></span><i><b style={{width:Math.min(100,p.total/Math.max(1,...workload.map(x=>x.total))*100)+'%'}}/></i></div>)}</div>:<p className="overview-empty">Ainda não há tarefas abertas.</p>}</section>
  </div>
 </section>;
}
