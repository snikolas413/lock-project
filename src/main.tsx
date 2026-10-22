import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main className="min-h-screen bg-[#10131a] px-6 text-slate-100">
      <nav className="mx-auto flex max-w-6xl items-center justify-between border-b border-white/10 py-6">
        <a className="flex items-center gap-3 font-bold tracking-tight" href="#inicio">
          <span className="grid size-9 place-items-center rounded-xl bg-lime-200 text-lg text-slate-950">L</span>
          <span>lock<span className="font-medium text-slate-400">project</span></span>
        </a>
        <span className="rounded-full border border-white/15 px-4 py-2 text-xs text-slate-400">Primeira versão em preparação</span>
      </nav>
      <section id="inicio" className="mx-auto max-w-5xl py-24 text-center md:py-32">
        <p className="text-xs font-bold tracking-[0.3em] text-lime-200">ORGANIZE. CONECTE. ENTREGUE.</p>
        <h1 className="mt-7 text-5xl font-semibold tracking-tight md:text-7xl">Todo projeto merece<br /><span className="text-lime-200">um caminho claro.</span></h1>
        <p className="mx-auto mt-7 max-w-xl text-base leading-8 text-slate-400">Um espaço para transformar ideias em trabalho organizado. Projetos, tarefas e progresso, conectados em um só lugar.</p>
        <a className="mt-8 inline-flex items-center gap-4 rounded-lg bg-lime-200 px-5 py-3 font-semibold text-slate-950 transition hover:-translate-y-0.5" href="https://github.com/snikolas413/lock-project">Acompanhar o projeto <span aria-hidden="true">↗</span></a>
        <div className="mx-auto mt-16 grid max-w-4xl gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left md:grid-cols-3">
          {[
            { title: 'A fazer', count: '02', tasks: ['Definir objetivos do projeto', 'Mapear a experiência inicial'] },
            { title: 'Em andamento', count: '01', tasks: ['Preparar a estrutura da aplicação'] },
            { title: 'Concluído', count: '01', tasks: ['Criar repositório independente'] },
          ].map((column) => (
            <section key={column.title} className="rounded-xl bg-white/[0.025] p-4">
              <h2 className="mb-4 flex justify-between text-sm font-semibold text-slate-300">{column.title}<span className="text-slate-500">{column.count}</span></h2>
              {column.tasks.map((task) => <article key={task} className="mb-2 rounded-lg border border-white/10 bg-[#191e28] p-4 text-sm text-slate-300">{task}</article>)}
            </section>
          ))}
        </div>
      </section>
      <footer className="mx-auto flex max-w-6xl justify-between border-t border-white/10 py-6 text-xs text-slate-500"><span>LOCK PROJECT © 2026</span><span>Clareza para o trabalho em equipe.</span></footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
