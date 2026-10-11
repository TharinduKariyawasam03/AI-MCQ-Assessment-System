import app from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';

await connectDb();

const server = app.listen(env.port, () => {
  console.log(`My Teacher API listening on http://localhost:${env.port}`);
});

async function shutdown() {
  server.close();
  await disconnectDb();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
