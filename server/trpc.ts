import { initTRPC } from '@trpc/server';
import { z } from 'zod';

const t = initTRPC.create();

export const appRouter = t.router({
  system: t.router({
    health: t.procedure.query(() => ({
      status: 'ok' as const,
      service: 'lock-project-api',
    })),
    echo: t.procedure
      .input(z.object({ message: z.string().trim().min(1).max(200) }))
      .query(({ input }) => ({ message: input.message })),
  }),
});

export type AppRouter = typeof appRouter;
