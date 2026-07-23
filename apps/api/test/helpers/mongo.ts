import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let server: MongoMemoryServer | null = null;

export async function startMongo(): Promise<string> {
  server = await MongoMemoryServer.create();
  const uri = server.getUri();
  await mongoose.connect(uri);
  // mongoose 9 builds autoIndex indexes in the background; geo queries must not
  // run before the 2dsphere index exists, so sync explicitly (mirrors src/test/test-db.ts).
  for (const m of Object.values(mongoose.models)) {
    await m.syncIndexes();
  }
  return uri;
}

export async function stopMongo(): Promise<void> {
  await mongoose.disconnect();
  await server?.stop();
  server = null;
}

export async function clearMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 1) return;
  for (const m of Object.values(mongoose.models)) {
    await m.deleteMany({});
  }
}
