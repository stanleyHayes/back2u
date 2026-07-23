import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let server: MongoMemoryServer | null = null;

export async function startTestMongo(): Promise<string> {
  server = await MongoMemoryServer.create();
  const uri = server.getUri();
  await mongoose.connect(uri);
  return uri;
}

export async function ensureTestIndexes(): Promise<void> {
  for (const m of Object.values(mongoose.models)) {
    await m.syncIndexes();
  }
}

export async function stopTestMongo(): Promise<void> {
  await mongoose.disconnect();
  await server?.stop();
  server = null;
}

export async function clearTestMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 1) return;
  for (const m of Object.values(mongoose.models)) {
    await m.deleteMany({});
  }
}
