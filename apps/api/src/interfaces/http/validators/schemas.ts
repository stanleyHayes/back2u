import { z } from 'zod';

// ---- Shared primitives ----

export const GeoPointSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
});

export const PlaceRefSchema = z.object({
  name: z.string().min(1),
  city: z.string().optional(),
  country: z.string().optional(),
  point: GeoPointSchema,
});

export const ItemImageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().min(1),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

export const EmailPreferencesSchema = z.object({
  marketing: z.boolean().optional(),
  matches: z.boolean().optional(),
  chat: z.boolean().optional(),
  reminders: z.boolean().optional(),
  courier: z.boolean().optional(),
});

// ---- Auth (core) ----

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  phone: z.string().min(1).optional(),
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

// ---- Items ----

export const CreateItemSchema = z.object({
  kind: z.enum(['lost', 'found']),
  classification: z.enum(['lost', 'stolen']),
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).optional(),
  images: z.array(ItemImageSchema).default([]),
  place: PlaceRefSchema,
  occurredAt: z.string().min(1),
  rewardAmount: z.number().int().nonnegative().optional(),
  institutionId: z.string().optional(),
  qrTagCode: z.string().optional(),
  serialNumber: z.string().optional(),
  imei: z.string().optional(),
});

export const UpdateItemSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    tags: z.array(z.string()).optional(),
    status: z
      .enum(['open', 'matched', 'claimed', 'returned', 'closed', 'archived', 'auctioned', 'donated'])
      .optional(),
    classification: z.enum(['lost', 'stolen']).optional(),
  })
  .strict();

// ---- Chat ----

export const SendMessageSchema = z.object({
  body: z.string().min(1),
  images: z.array(z.object({ url: z.string().url() })).optional(),
});

export const TypingSchema = z.object({
  typing: z.boolean(),
});

// ---- Rewards ----

export const ReleaseRewardSchema = z.object({
  finderId: z.string().min(1),
});

// ---- Uploads ----

export const UploadSignatureSchema = z.object({
  folder: z.string().min(1),
});

// ---- Verifications ----

export const VerificationProofSchema = z.object({
  kind: z.enum(['receipt', 'imei', 'serial', 'old_photo', 'other']),
  url: z.string().url().optional(),
  text: z.string().optional(),
});

export const SubmitVerificationSchema = z.object({
  itemId: z.string().min(1),
  answers: z.array(z.object({ questionId: z.string().min(1), answer: z.string().min(1) })).min(1),
  proofs: z.array(VerificationProofSchema).default([]),
});

export const DecideVerificationSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  note: z.string().optional(),
});

// ---- Me / profile ----

export const UpdateProfileSchema = z
  .object({
    name: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    avatarUrl: z.string().url().optional(),
    emailPreferences: EmailPreferencesSchema.optional(),
  })
  .strict();

export const PushTokenSchema = z.object({
  token: z.string().min(1),
});

export const LocaleSchema = z.object({
  locale: z.enum(['en', 'fr', 'tw', 'ga', 'ee']),
});

export const RedeemPointsSchema = z.object({
  points: z.number().int().positive(),
});

export const DescribeImageSchema = z.object({
  imageUrl: z.string().url(),
});

export const AiAssistSchema = z.object({
  action: z.enum([
    'formalize',
    'summarize',
    'make_casual',
    'expand',
    'fix_grammar',
    'improve_clarity',
    'generate_title',
    'generate_message',
    'create_from_prompt',
    'translate',
  ]),
  text: z.string().optional(),
  prompt: z.string().optional(),
  context: z.string().optional(),
  tone: z.string().optional(),
  language: z.string().optional(),
});
