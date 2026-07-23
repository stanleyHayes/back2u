import { inject, injectable } from 'inversify';
import { Resend } from 'resend';
import type { Locale } from '@back2u/shared-types';

import type { IEmailService, II18nService, ILogger } from '../../../application/ports/services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';
import {
  chatNotificationEmail,
  expiryReminderEmail,
  genericEmail,
  matchAlertEmail,
  passwordResetEmail,
  tagScanContactEmail,
  urgentExpiryReminderEmail,
  welcomeEmail,
  type EmailTemplate,
} from '../templates/email-templates.js';

@injectable()
export class ResendEmailService implements IEmailService {
  private readonly resend: Resend | null;

  constructor(
    @inject(TOKENS.Env) private readonly env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
    @inject(TOKENS.I18nService) private readonly i18n: II18nService,
  ) {
    const key = env.RESEND_API_KEY?.trim();
    this.resend = key ? new Resend(key) : null;
  }

  async sendWelcome(to: string, name: string, locale?: Locale): Promise<void> {
    const t = welcomeEmail(name);
    t.subject = this.i18n.t('email.welcome.subject', locale);
    await this.send(to, t);
  }

  async sendMatchAlert(to: string, name: string, itemTitle: string, matchUrl: string, locale?: Locale): Promise<void> {
    const t = matchAlertEmail(name, itemTitle, matchUrl);
    t.subject = this.i18n.t('email.match.subject', locale, { title: itemTitle });
    await this.send(to, t);
  }

  async sendChatNotification(to: string, name: string, threadUrl: string, locale?: Locale): Promise<void> {
    const t = chatNotificationEmail(name, threadUrl);
    t.subject = this.i18n.t('email.chat.subject', locale);
    await this.send(to, t);
  }

  async sendPasswordReset(to: string, name: string, resetUrl: string, _locale?: Locale): Promise<void> {
    await this.send(to, passwordResetEmail(name, resetUrl));
  }

  async sendTagScanContact(to: string, ownerName: string, finderMessage: string, replyUrl: string): Promise<void> {
    await this.send(to, tagScanContactEmail(ownerName, finderMessage, replyUrl));
  }

  async sendExpiryReminder(to: string, name: string, itemTitle: string, itemUrl: string, _locale?: Locale): Promise<void> {
    await this.send(to, expiryReminderEmail(name, itemTitle, itemUrl));
  }

  async sendUrgentExpiryReminder(to: string, name: string, itemTitle: string, itemUrl: string, _locale?: Locale): Promise<void> {
    await this.send(to, urgentExpiryReminderEmail(name, itemTitle, itemUrl));
  }

  async sendCourierUpdate(to: string, name: string, subject: string, body: string, _locale?: Locale): Promise<void> {
    await this.send(to, genericEmail(name, subject, body));
  }

  async sendMarketplaceAlert(to: string, name: string, subject: string, body: string, _locale?: Locale): Promise<void> {
    await this.send(to, genericEmail(name, subject, body));
  }

  async sendGenericNotification(to: string, name: string, subject: string, body: string, _locale?: Locale): Promise<void> {
    await this.send(to, genericEmail(name, subject, body));
  }

  private async send(to: string, template: EmailTemplate): Promise<void> {
    if (!this.resend) {
      this.logger.info('email noop (no RESEND_API_KEY)', {
        to,
        subject: template.subject,
        text: template.text,
      });
      return;
    }
    const { error } = await this.resend.emails.send({
      from: this.env.RESEND_FROM,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
    if (error) {
      this.logger.warn('resend send failed', { to, subject: template.subject, error: error.message });
      throw new Error(`Resend send failed: ${error.message}`);
    }
  }
}
