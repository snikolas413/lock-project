# Lock Project: especificação inicial do produto

## Visão

Oferecer uma ferramenta de gerenciamento de projetos e tarefas para equipes, inspirada no fluxo de trabalho do Jira, com uma experiência inicial simples e espaço para crescer.

## Usuários e necessidades

- **Membro da equipe:** entender o que precisa fazer, registrar progresso e colaborar em tarefas.
- **Líder de projeto:** organizar o trabalho em etapas, distribuir responsabilidades e identificar bloqueios.
- **Administrador do workspace:** gerenciar membros, permissões e configurações.

## MVP proposto

1. Workspaces e associação de usuários.
2. Projetos dentro de um workspace.
3. Quadro com colunas configuráveis e tarefas movíveis entre estados.
4. Tarefas com título, descrição, prioridade, responsável, datas e comentários.
5. Filtros por estado, prioridade e responsável.
6. Histórico básico de alterações e trilha de auditoria para ações relevantes.
7. Autenticação e autorização no servidor.

## Requisitos transversais

- Validar todas as entradas no backend.
- Aplicar autorização no nível de workspace/projeto, não apenas ocultar controles no frontend.
- Evitar exposição de segredos e dados entre workspaces.
- Manter migrations de PostgreSQL versionadas e revisáveis.
- Cobrir regras de domínio com testes Vitest.
- Projetar estados de carregamento, vazio, erro e falta de permissão.

## Fora do primeiro MVP

Integrações complexas, automações avançadas, relatórios extensos, aplicativo móvel nativo e paridade completa com Jira.

## Critérios de aceite iniciais

- Um usuário autorizado consegue criar um projeto e uma tarefa.
- Uma tarefa pode ser atualizada e movida entre estados permitidos.
- Usuários sem acesso não conseguem consultar ou alterar dados do projeto via API.
- A aplicação pode ser configurada sem reutilizar credenciais do TicketFlow.
- Testes e verificações de tipos podem ser executados em CI.

## Decisões pendentes

- Provedor e fluxo de autenticação.
- Modelo de workspaces, convites e funções.
- Convenção de identificadores e estratégia de exclusão/arquivamento.
- Estratégia de anexos e limites de armazenamento.
- Plano e região do projeto Supabase independente.
