import http from 'http';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env, reportConfigStatus } from './config/env.js';
import { logger } from './utils/logger.js';

async function main() {
  reportConfigStatus(logger);
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.port, () => {
    logger.info(`MeetMind API listening on :${env.port}`, { env: env.nodeEnv });
  });

  // Graceful shutdown — finish in-flight requests, close DB connections.
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down`);
    server.close(async () => {
      await disconnectDatabase().catch(() => {});
      process.exit(0);
    });
    // Force-exit if close hangs (e.g. long-lived connections).
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled rejection', { message: err?.message, stack: err?.stack });
  });
}

main().catch((err) => {
  logger.error('Fatal startup error', { message: err.message });
  process.exit(1);
});
