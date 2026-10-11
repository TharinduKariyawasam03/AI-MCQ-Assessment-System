import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { env } from './env.js';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const DEV_PORT = 27018;
// journal=true: a write is acknowledged only once it is on disk, because the dev
// mongod is killed, not shut down cleanly, when its parent process exits.
const DEV_URI = `mongodb://127.0.0.1:${DEV_PORT}/myteacher?journal=true`;

let devServer = null;

// With no MONGO_URI we run a local mongod that keeps its data in server/.data,
// so the app works without installing MongoDB. It listens on a fixed port so a
// second process (the seed script) joins the running one instead of starting another.
async function connectDevDatabase() {
  try {
    await mongoose.connect(DEV_URI, { serverSelectionTimeoutMS: 1000 });
    return;
  } catch {
    await mongoose.disconnect();
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const dbPath = path.join(serverRoot, '.data');
  fs.mkdirSync(dbPath, { recursive: true });
  devServer = await MongoMemoryServer.create({
    instance: { dbPath, storageEngine: 'wiredTiger', port: DEV_PORT },
  });
  await mongoose.connect(DEV_URI);
}

export async function connectDb() {
  if (env.mongoUri) {
    await mongoose.connect(env.mongoUri);
    console.log('MongoDB connected');
  } else {
    await connectDevDatabase();
    console.log('Development database ready (data in server/.data)');
  }
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (devServer) await devServer.stop({ doCleanup: false });
}
