import mongoose from 'mongoose';

export async function connectMongo(uri: string): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  // Indexes are managed explicitly via ensureIndexes()/syncIndexes().
  await mongoose.connect(uri, { autoIndex: false, serverSelectionTimeoutMS: 10_000 });
  return mongoose;
}
