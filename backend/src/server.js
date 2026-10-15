import app from './app.js';
import { config } from './config/env.js';
import { initializeSessionStore } from './services/sessionStore.js';
import { initializeUserStore } from './services/userStore.js';

await Promise.all([initializeUserStore(), initializeSessionStore()]);

const server = app.listen(config.port, config.host);
server.on('listening', () => {
  console.info(`Lynn portfolio API listening on http://${config.host}:${config.port}`);
});
server.on('error', (error) => {
  console.error('Could not start the Lynn portfolio API:', error.message);
  process.exitCode = 1;
});

function shutdown(signal) {
  console.info(`${signal} received; closing the API server.`);
  server.close((error) => {
    if (error) {
      console.error('Error while closing the API server:', error);
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
