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
 * - release: pays the finder via the Paystack Transfers API (create mobile-money
 *            recipient -> initiate transfer). Needs the finder's momo provider +
 *            number; when those are missing it logs the payout as pending for
 *            manual settlement from the Paystack dashboard instead of failing.
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

  async release(input: {
    providerRef: string;
    recipientPhone: string;
    recipientName?: string;
    recipientProvider?: string;
    amountMinor?: number;
    currency?: string;
  }): Promise<void> {
    if (!this.paystack.isEnabled()) {
      this.logger.info('escrow release noop (Paystack not configured)', {
        providerRef: input.providerRef,
      });
      return;
    }
    const account = input.recipientPhone.replace(/[^\d]/g, '');
    // A live Paystack Transfer needs the finder's momo provider + a payout amount.
    // Without them (finder hasn't set payout details), leave it for manual
    // settlement from the Paystack dashboard rather than failing the release.
    if (!input.recipientProvider || !input.amountMinor || !account) {
      this.logger.info(
        'reward payout pending — missing momo details; settle via Paystack dashboard',
        {
          providerRef: input.providerRef,
          hasProvider: !!input.recipientProvider,
          hasAmount: !!input.amountMinor,
        },
      );
      return;
    }
    try {
      const { recipientCode } = await this.paystack.createTransferRecipient({
        name: input.recipientName || 'bak2me finder',
        accountNumber: account,
        bankCode: input.recipientProvider,
        currency: input.currency,
      });
      const { transferCode, status } = await this.paystack.initiateTransfer({
        amountMinor: input.amountMinor,
        recipientCode,
        reason: `bak2me reward payout ${input.providerRef}`,
        reference: `payout-${input.providerRef}`,
        currency: input.currency,
      });
      this.logger.info('reward payout initiated', {
        providerRef: input.providerRef,
        transferCode,
        status,
      });
    } catch (err) {
      // Don't fail the reward release on a payout hiccup — the reward is already
      // marked released; surface for dashboard settlement / retry.
      this.logger.warn('reward payout failed; settle via Paystack dashboard', {
        providerRef: input.providerRef,
        err: String(err),
      });
    }
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
