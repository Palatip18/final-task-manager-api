import { app } from './app.ts';
import { env } from './config/env.ts';
import { prisma } from './lib/prisma.ts';

await prisma.$connect();

const server = app.listen(env.PORT);

server.on('listening', () => {
  console.log(`Task Manager API: http://localhost:${env.PORT}`);
});

server.on('error', async (error: NodeJS.ErrnoException) => {
  console.error(`Server could not start (${error.code ?? 'unknown error'})`);
  await prisma.$disconnect();
  process.exitCode = 1;
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  }));
}
