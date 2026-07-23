import { Schema, model } from 'mongoose';

import type { InstitutionLeadSnapshot } from '../../../../domain/institution/institution-lead.entity.js';

export type InstitutionLeadDoc = Omit<InstitutionLeadSnapshot, 'id'> & { _id: string };

const institutionLeadSchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String },
    contactName: { type: String, required: true },
    contactEmail: { type: String, required: true },
    contactPhone: { type: String },
    city: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
    estimatedVolume: { type: String },
    message: { type: String },
    status: {
      type: String,
      enum: ['new', 'contacted', 'approved', 'rejected'],
      required: true,
      index: true,
    },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  { versionKey: false },
);

export const InstitutionLeadModel = model<InstitutionLeadDoc>(
  'InstitutionLead',
  institutionLeadSchema,
);
