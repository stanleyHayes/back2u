import { Schema, model } from 'mongoose';

import type { PoliceCaseSnapshot } from '../../../../domain/announcement/police-case.entity.js';

export type PoliceCaseDoc = Omit<PoliceCaseSnapshot, 'id'> & { _id: string };

const policeCaseSchema = new Schema(
  {
    _id: { type: String, required: true },
    itemId: { type: String, required: true, index: true },
    caseNumber: { type: String },
    station: { type: String },
    pdfUrl: { type: String },
    filedAt: { type: Date },
    createdAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const PoliceCaseModel = model<PoliceCaseDoc>('PoliceCase', policeCaseSchema);
