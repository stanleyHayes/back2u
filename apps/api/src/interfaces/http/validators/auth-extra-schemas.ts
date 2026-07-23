import { z } from 'zod';

// ---- Phone OTP ----

export const RequestPhoneOtpSchema = z.object({
  phone: z.string().min(1),
});

export const VerifyPhoneOtpSchema = z.object({
  phone: z.string().min(1),
  code: z.string().min(1),
});

// ---- Email verification ----

export const ConfirmEmailVerificationSchema = z.object({
  code: z.string().min(1),
});

// ---- Password reset ----

export const RequestPasswordResetSchema = z.object({
  email: z.string().email(),
});

export const ConfirmPasswordResetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

// ---- Logout ----

export const LogoutSchema = z.object({
  refreshToken: z.string().min(1),
});
