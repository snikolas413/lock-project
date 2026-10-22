import express from 'express';
import path from 'node:path';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { appRouter } from './trpc.js';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const clientBuildPath = path.resolve(process.cwd(), 'dist');

app.disable('x-powered-by');
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'lock-project-api' });
});
app.use('/trpc', createExpressMiddleware({ router: appRouter }));
app.use(express.static(clientBuildPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Lock Project listening on port ${port}`);
});
