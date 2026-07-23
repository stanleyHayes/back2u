import { inject, injectable } from 'inversify';

import type { ILogger } from '../../../application/ports/services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    status: 'success' | 'abandoned' | 'failed';
    reference: string;
    amount: number;
    currency: string;
    metadata?: Record<string, unknown>;
    paid_at?: string;
  };
}

@injectable()
export class PaystackService {
  private readonly enabled: boolean;
  private readonly secretKey: string | null;
  private readonly publicKey: string | null;

  constructor(
    @inject(TOKENS.Env) private readonly env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {
    this.secretKey = env.PAYSTACK_SECRET_KEY ?? null;
    this.publicKey = env.PAYSTACK_PUBLIC_KEY ?? null;
    this.enabled = Boolean(this.secretKey);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async initializeTransaction(input: {
    amount: number;
    currency: string;
    email: string;
    reference: string;
    metadata?: Record<string, unknown>;
    callbackUrl?: string;
  }): Promise<{ authorizationUrl: string; reference: string; accessCode: string }> {
    if (!this.secretKey) throw new Error('Paystack not configured');

    const res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        amount: input.amount,
        currency: input.currency,
        reference: input.reference,
        metadata: input.metadata,
        callback_url: input.callbackUrl,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Paystack initialize failed: ${res.status} ${text}`);
    }

    const json = (await res.json()) as PaystackInitializeResponse;
    if (!json.status) {
      throw new Error(`Paystack initialize failed: ${json.message}`);
    }

    return {
      authorizationUrl: json.data.authorization_url,
      reference: json.data.reference,
      accessCode: json.data.access_code,
    };
  }

  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse['data']> {
    if (!this.secretKey) throw new Error('Paystack not configured');

    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Paystack verify failed: ${res.status} ${text}`);
    }

    const json = (await res.json()) as PaystackVerifyResponse;
    if (!json.status) {
      throw new Error(`Paystack verify failed: ${json.message}`);
    }

    return json.data;
  }

  verifyWebhookSignature(body: string, signature: string): boolean {
    if (!this.secretKey) return false;
    // Paystack HMAC-SHA512 signature verification
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', this.secretKey).update(body).digest('hex');
    return hash === signature;
  }
}
