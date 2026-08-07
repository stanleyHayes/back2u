import { inject, injectable } from 'inversify';

import type { ILogger, IPaymentEscrowService } from '../../../application/ports/services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Id } from '../../../domain/shared/id.js';
import { PaystackService } from './paystack.service.js';

/**
 * Reward escrow backed by Paystack (the only payment rail — Hubtel is retired).
 *
 * - hold:    initialises a Paystack transaction to collect the reward from the
 *            poster. Resilient — a payment-side failure never blocks item
 *            creation; the reward is still recorded and can be settled later.
 * - refund:  issues a Paystack refund against the held transaction reference.
 * - release: finder payouts go through the Paystack Transfers API, which needs
 *            the recipient's mobile-money provider + account details (not just a
 *            phone). Until those are collected we log the payout as pending so it
 *            can be settled from the Paystack dashboard.
 */
@injectable()
export class PaystackEscrow implements IPaymentEscrowService {
  constructor(
    @inject(PaystackService) private readonly paystack: PaystackService,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  async hold(input: {
    rewardId: Id;
    amount: number;
    currency: string;
    payerPhone?: string;
    payerEmail?: string;
  }): Promise<{ providerRef: string }> {
    const reference = `reward-${input.rewardId}`;
    if (!this.paystack.isEnabled()) {
      this.logger.info('escrow hold noop (Paystack not configured)', { ...input, reference });
      return { providerRef: `noop-hold-${input.rewardId}` };
    }
    try {
      const email =
        input.payerEmail?.trim() ||
        (input.payerPhone
          ? `${input.payerPhone.replace(/[^\d]/g, '')}@momo.bak2me.com`
          : 'payments@bak2me.com');
      const { authorizationUrl, reference: ref } = await this.paystack.initializeTransaction({
        amount: input.amount, // already in minor units (pesewa/kobo)
        currency: input.currency,
        email,
        reference,
        metadata: { rewardId: input.rewardId, kind: 'reward_escrow' },
      });
      this.logger.info('reward escrow initialised', { rewardId: input.rewardId, authorizationUrl });
      return { providerRef: ref };
    } catch (err) {
      // Never let a payment hiccup block the item going live.
      this.logger.warn('escrow hold failed; recording reward without a live hold', {
        rewardId: input.rewardId,
        err: String(err),
      });
      return { providerRef: reference };
    }
  }

  async release(input: { providerRef: string; recipientPhone: string }): Promise<void> {
    if (!this.paystack.isEnabled()) {
      this.logger.info('escrow release noop (Paystack not configured)', input);
      return;
    }
    // Paystack Transfers require a recipient (mobile-money provider + account),
    // which the reward model does not yet carry. Log for dashboard settlement.
    this.logger.info('reward payout pending Paystack Transfer settlement', input);
  }

  async refund(providerRef: string): Promise<void> {
    if (!this.paystack.isEnabled() || providerRef.startsWith('noop-')) {
      this.logger.info('escrow refund noop', { providerRef });
      return;
    }
    await this.paystack.refundTransaction(providerRef);
    this.logger.info('reward escrow refunded', { providerRef });
  }
}
