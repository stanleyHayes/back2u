import mongoose from 'mongoose';

import type { MatchStatus } from '@back2u/shared-types';

export interface MatchDoc {
  _id: string;
  lostItemId: string;
  foundItemId: string;
  imageScore: number;
  textScore: number;
  geoScore: number;
  timeScore: number;
  score: number;
  status: MatchStatus;
  returnConfirmedByLost?: string;
  returnConfirmedByFound?: string;
  returnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new mongoose.Schema<MatchDoc>(
  {
    _id: { type: String, required: true },
    lostItemId: { type: String, required: true },
    foundItemId: { type: String, required: true },
    imageScore: { type: Number, required: true },
    textScore: { type: Number, required: true },
    geoScore: { type: Number, required: true },
    timeScore: { type: Number, required: true },
    score: { type: Number, required: true },
    status: {
      type: String,
      enum: ['suggested', 'accepted', 'rejected', 'verified'],
      required: true,
    },
    returnConfirmedByLost: { type: String },
    returnConfirmedByFound: { type: String },
    returnedAt: { type: Date },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { collection: 'matches', versionKey: false },
);

matchSchema.index({ lostItemId: 1, foundItemId: 1 }, { unique: true });
matchSchema.index({ lostItemId: 1, createdAt: -1 });
matchSchema.index({ foundItemId: 1, createdAt: -1 });
matchSchema.index({ status: 1, createdAt: -1 });
matchSchema.index({ createdAt: -1 });

export const MatchModel = mongoose.model<MatchDoc>('Match', matchSchema);
