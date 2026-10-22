# Supabase setup for Lock Project

The production database for Lock Project is a dedicated Supabase project, separate from TicketFlow.

- Project ref: `ilsqalsxgzjeklpoymbv`
- Project URL: https://ilsqalsxgzjeklpoymbv.supabase.co
- Region: São Paulo (`sa-east-1`)

## Database schema

The initial migration creates profiles, workspaces, workspace membership, projects, issues, comments, labels and issue-label links. Row Level Security (RLS) is enabled on all application tables. A workspace creator is automatically assigned the `owner` role.

Migration files are stored in `drizzle/`. The migration has been applied to the dedicated Supabase project.

## Local environment

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to the connection string from the Lock Project Supabase dashboard. Use the server-side connection string only in the API runtime.
3. Set `VITE_SUPABASE_URL` to the project URL above.
4. Set `VITE_SUPABASE_ANON_KEY` to the project's publishable key. A publishable key may be used in browser code when RLS is configured. Never put a `service_role` key in any `VITE_*` variable or commit any secret to Git.
5. Install dependencies with `pnpm install`, then run `pnpm check` and `pnpm test`.

## Important security note

The current application foundation is not yet a complete authenticated product. RLS policies protect direct authenticated access through Supabase, but any server-side PostgreSQL connection must enforce authorization explicitly or use a correctly scoped user context. Do not expose database credentials to the browser. Before production deployment, finish Supabase Auth integration and verify the workspace/project authorization flows with tests.
