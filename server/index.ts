import express from 'express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.disable('x-powered-by');
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'lock-project-api' });
});
app.use('/trpc', createExpressMiddleware({ router: appRouter }));

app.listen(port, '0.0.0.0', () => {
  console.log(`Lock Project API listening on port ${port}`);
});
