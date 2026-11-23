const app = require('./app');
const config = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./services/databaseService');

let server;
let shuttingDown = false;

async function startServer() {
  await connectDatabase();
  server = app.listen(config.PORT, '0.0.0.0', () => {
    console.info(`[server] Roomly API listening on 0.0.0.0:${config.PORT} (${config.NODE_ENV})`);
  });
  return server;
}

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.info(`[server] ${signal} received; shutting down gracefully.`);

  const forceExit = setTimeout(() => {
    console.error('[server] Graceful shutdown timed out.');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
    await disconnectDatabase();
    process.exitCode = 0;
  } catch (error) {
    console.error('[server] Shutdown failed:', error);
    process.exitCode = 1;
  } finally {
    clearTimeout(forceExit);
  }
}

process.on('SIGINT', () => { void shutdown('SIGINT'); });
process.on('SIGTERM', () => { void shutdown('SIGTERM'); });

if (require.main === module) {
  startServer().catch(async (error) => {
    console.error('[server] Startup failed:', error);
    try { await disconnectDatabase(); } catch (disconnectError) { console.error('[database] Disconnect after startup failure failed:', disconnectError); }
    process.exitCode = 1;
  });
}

module.exports = { startServer, shutdown };