# Lock Project

Plataforma de gerenciamento de projetos, tarefas e fluxos de trabalho, inspirada em ferramentas como Jira.

> **Status:** planejamento e fundação inicial. A arquitetura e os recursos descritos neste documento são a direção do produto, não funcionalidades já implementadas.

## Objetivo

Reunir projetos, quadros, tarefas, responsáveis, prioridades e acompanhamento de progresso em uma experiência clara e extensível para equipes.

## Stack planejada

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS 4 e Radix UI
- **Backend:** Node.js, Express e tRPC
- **Banco de dados:** PostgreSQL, Drizzle ORM e migrations versionadas
- **Qualidade:** Vitest e verificações de TypeScript
- **Entrega:** Docker e Render
- **Integrações:** projeto Supabase próprio para o Lock Project, independente do TicketFlow

A stack é baseada na identificada no repositório TicketFlow. Este projeto terá código, configuração, credenciais e banco próprios.

## Princípios

1. Isolamento completo em relação ao TicketFlow.
2. Tipagem de ponta a ponta entre cliente e API.
3. Segurança por padrão: validação de entrada, autorização no servidor e segredos somente em variáveis de ambiente.
4. Migrações revisáveis e compatíveis com PostgreSQL.
5. Testes automatizados e configuração reproduzível para desenvolvimento e deploy.

## Escopo inicial proposto

- Espaços de trabalho e projetos
- Quadros de tarefas com estados configuráveis
- Tarefas com descrição, prioridade, responsável e datas
- Comentários e histórico de alterações
- Busca, filtros e visualizações por projeto
- Autenticação e controle de acesso por função

O escopo será refinado antes de considerar esses recursos implementados.

## Desenvolvimento

Os comandos serão definidos junto com a estrutura inicial do aplicativo. Não configure `DATABASE_URL` ou credenciais do TicketFlow neste projeto. Use um banco Supabase separado e um arquivo `.env` local não versionado.

## Configuração

1. Instale a versão de Node.js definida no projeto e o pnpm.
2. Copie `.env.example` para `.env` e preencha os valores do ambiente Lock Project.
3. Instale as dependências e aplique as migrations depois que a configuração de banco estiver pronta.

Nunca faça commit de `.env`, tokens, chaves privadas ou credenciais de serviço.

## Deploy

A configuração de deploy será mantida neste repositório e preparada para Docker/Render. Variáveis e recursos de produção devem ser criados separadamente dos ambientes locais.

## Licença

Ainda não definida. A visibilidade pública do repositório não determina, por si só, uma licença de uso do código.
