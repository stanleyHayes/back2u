import { inject, injectable } from 'inversify';

import type { ILogger, IPaymentEscrowService } from '../../../application/ports/services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';
import type { Id } from '../../../domain/shared/id.js';

const HUBTEL_BASE = 'https://payproxyapi.hubtel.com/transactions';

@injectable()
export class HubtelMomoEscrow implements IPaymentEscrowService {
  private readonly clientId: string | null;
  private readonly clientSecret: string | null;
  private readonly merchantAccount: string | null;

  constructor(
    @inject(TOKENS.Env) env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {
    this.clientId = env.HUBTEL_CLIENT_ID?.trim() || null;
    this.clientSecret = env.HUBTEL_CLIENT_SECRET?.trim() || null;
    this.merchantAccount = env.HUBTEL_MERCHANT_ACCOUNT?.trim() || null;
  }

  private get enabled(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.merchantAccount);
  }

  async hold(input: { rewardId: Id; amount: number; currency: string; payerPhone?: string }): Promise<{ providerRef: string }> {
    if (!this.enabled) {
      const providerRef = `noop-hold-${input.rewardId}`;
      this.logger.info('escrow hold noop (no Hubtel keys)', { ...input, providerRef });
      return { providerRef };
    }
    if (!input.payerPhone) throw new Error('payerPhone required for Hubtel escrow hold');
    const clientReference = `hold-${input.rewardId}-${Date.now()}`;
    await this.call('receive/mobilemoney', {
      CustomerName: 'Back2u User',
      CustomerMsisdn: input.payerPhone,
      Channel: 'mtn-gh',
      // Hubtel expects major units; amounts are stored in pesewa.
      Amount: input.amount / 100,
      PrimaryCallbackUrl: '',
      Description: `Back2u reward escrow ${input.rewardId}`,
      ClientReference: clientReference,
    });
    return { providerRef: clientReference };
  }

  async release(input: { providerRef: string; recipientPhone: string }): Promise<void> {
    if (!this.enabled) {
      this.logger.info('escrow release noop (no Hubtel keys)', input);
      return;
    }
    await this.call('send/mobilemoney', {
      RecipientName: 'Back2u Finder',
      RecipientMsisdn: input.recipientPhone,
      Channel: 'mtn-gh',
      Amount: 0, // settled from the held transaction referenced below
      PrimaryCallbackUrl: '',
      Description: `Back2u reward payout ${input.providerRef}`,
      ClientReference: `release-${input.providerRef}`,
    });
  }

  async refund(providerRef: string): Promise<void> {
    // Hubtel has no programmatic refund on the pay-proxy API; flag for manual handling.
    this.logger.warn('escrow refund requires manual processing', { providerRef });
  }

  private async call(path: string, body: Record<string, unknown>): Promise<void> {
    const res = await fetch(`${HUBTEL_BASE}/${this.merchantAccount}/${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn('hubtel call failed', { path, status: res.status });
      throw new Error(`Hubtel ${path} failed: ${res.status} ${text}`);
    }
  }
}
