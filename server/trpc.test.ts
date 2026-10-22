import { describe, expect, it } from 'vitest';
import { appRouter } from './trpc.js';

describe('system.health', () => {
  it('returns API health metadata', async () => {
    const caller = appRouter.createCaller({});
    await expect(caller.system.health()).resolves.toEqual({
      status: 'ok',
      service: 'lock-project-api',
    });
  });
});
