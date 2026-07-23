import { Types } from 'mongoose';

export type Id = string;

export const newId = (): Id => new Types.ObjectId().toHexString();
export const isId = (v: unknown): v is Id =>
  typeof v === 'string' && Types.ObjectId.isValid(v);
