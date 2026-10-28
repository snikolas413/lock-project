import type { ChangeEvent } from 'react';

export type AdminUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_platform_admin: boolean;
  memberships: { workspace_id: string; workspace_name: string; role: string }[];
};

type AdminUsersSectionProps = {
  users: AdminUser[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onOpenTeams: () => void;
};

const roleLabels: Record<string, string> = {
  owner: 'Proprietário',
  admin: 'Administrador do time',
  analyst: 'Analista',
  member: 'Membro',
  viewer: 'Visualizador',
};

function matchesSearch(user: AdminUser, search: string) {
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
  if (!normalizedSearch) return true;

  return [
    user.display_name,
    user.email,
    ...user.memberships.map(membership => membership.workspace_name),
  ].some(value => (value || '').toLocaleLowerCase('pt-BR').includes(normalizedSearch));
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('pt-BR', options).format(new Date(value));
}

export function AdminUsersSection({
  users,
  loading,
  search,
  onSearchChange,
  onRefresh,
  onOpenTeams,
}: AdminUsersSectionProps) {
  const filteredUsers = users.filter(user => matchesSearch(user, search));

  return (
    <section className="workspace-management user-admin-page">
      <div className="section-title">
        <div>
          <p className="eyebrow">CONTROLE GLOBAL</p>
          <h2>Administração de usuários</h2>
          <p className="muted">
            Consulte as contas cadastradas, veja quem já está vinculado a um time e confira o último acesso. As permissões são gerenciadas em “Times e acessos”.
          </p>
        </div>
        <button type="button" className="button button-primary" disabled={loading} onClick={onRefresh}>
          {loading ? 'Atualizando…' : 'Atualizar lista'} ↻
        </button>
      </div>

      <div className="admin-user-summary">
        <article className="stat-card">
          <span className="stat-label">Total de usuários</span>
          <strong>{users.length}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Vinculados a times</span>
          <strong>{users.filter(user => user.memberships.length > 0).length}</strong>
        </article>
        <article className="stat-card">
          <span className="stat-label">Sem vínculo com time</span>
          <strong>{users.filter(user => user.memberships.length === 0).length}</strong>
        </article>
      </div>

      <div className="field admin-user-search">
        <label htmlFor="admin-user-search">Buscar usuário</label>
        <input
          id="admin-user-search"
          type="search"
          value={search}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onSearchChange(event.target.value)}
          placeholder="Nome, e-mail ou time…"
          maxLength={160}
        />
        <small className="muted">{filteredUsers.length} resultado(s)</small>
      </div>

      {loading && !users.length ? (
        <div className="loading">Carregando usuários…</div>
      ) : filteredUsers.length ? (
        <div className="admin-user-list">
          {filteredUsers.map(user => (
            <article className="admin-user-card" key={user.id}>
              <div className="admin-user-main">
                <span className="assignee-avatar">
                  {(user.display_name || user.email || 'U').slice(0, 1).toUpperCase()}
                </span>
                <div className="admin-user-identity">
                  <strong>{user.display_name || 'Sem nome definido'}</strong>
                  <span>{user.email || 'E-mail indisponível'}</span>
                  <small>
                    Cadastrado em {formatDate(user.created_at, { dateStyle: 'medium' })}
                    {user.last_sign_in_at
                      ? ' · Último acesso ' + formatDate(user.last_sign_in_at, { dateStyle: 'short', timeStyle: 'short' })
                      : ' · Ainda não acessou'}
                  </small>
                </div>
                <span className={user.is_platform_admin ? 'admin-role-badge' : 'member-role-badge'}>
                  {user.is_platform_admin ? 'Administrador geral' : 'Usuário'}
                </span>
              </div>

              <div className="admin-user-memberships">
                <strong>Times vinculados</strong>
                {user.memberships.length ? (
                  user.memberships.map(membership => (
                    <span className="admin-membership-chip" key={membership.workspace_id}>
                      {membership.workspace_name}
                      <small>{roleLabels[membership.role] || membership.role}</small>
                    </span>
                  ))
                ) : (
                  <span className="muted">Sem vínculo com times</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>Nenhum usuário encontrado</strong>
          <p>As contas aparecerão aqui após o cadastro ou convite.</p>
        </div>
      )}

      <div className="admin-user-help">
        <strong>Como administrar acessos</strong>
        <p>
          Para convidar alguém, escolher o time e definir o cargo, abra “Times e acessos”. O
          administrador geral não precisa pertencer a um time e mantém acesso global à plataforma.
        </p>
        <button type="button" className="button button-secondary" onClick={onOpenTeams}>
          Abrir times e permissões ↗
        </button>
      </div>
    </section>
  );
}
