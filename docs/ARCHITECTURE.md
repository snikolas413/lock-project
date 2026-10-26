# Arquitetura inicial

## Componentes

- **Web:** React 19 + Vite + TypeScript; Tailwind CSS 4 para estilos e Radix UI para primitivas acessíveis.
- **API:** Express com tRPC para contratos tipados entre frontend e backend.
- **Persistência:** PostgreSQL acessado por Drizzle ORM; alterações de esquema em migrations versionadas.
- **Testes:** Vitest para lógica de domínio e integração selecionada.
- **Entrega:** Docker e Render, com configuração específica deste repositório.

## Direção de organização

A estrutura concreta será ajustada ao criar o esqueleto executável. Como ponto de partida, separar aplicação web, API, lógica de domínio, persistência e testes; evitar que regras de negócio fiquem acopladas aos componentes React ou aos handlers HTTP.

## Segurança e configuração

- Validar payloads no limite da API.
- Aplicar autenticação e autorização em cada operação protegida.
- Manter segredos apenas no ambiente de execução; `.env` fica fora do Git.
- Usar variáveis exclusivas do Lock Project para banco e serviços.
- Não copiar dados, credenciais ou configurações secretas do TicketFlow.

## Banco de dados

O banco será um projeto Supabase separado. Drizzle será usado para modelagem e migrations PostgreSQL. A aplicação não deve executar migrations automaticamente durante cada inicialização de produção sem uma etapa de deploy controlada.

## Qualidade e entrega

CI deve executar instalação reprodutível, checagem de tipos, lint quando configurado, testes e build. O Dockerfile e a configuração Render devem ser criados e validados com o aplicativo inicial, antes do deploy.

## Estado

Este documento registra a direção arquitetural. Não implica que API, autenticação, migrations ou deploy já estejam implementados.
