import { inject, injectable } from 'inversify';

import type { IAppUrls } from '../../application/ports/extra-services.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { Env } from '../../config/env.js';

/**
 * Builds links into the public web app from the env-configured APP_PUBLIC_URL,
 * so customer-facing URLs in emails/SMS/push are not hardcoded (white-label / staging).
 */
@injectable()
export class AppUrls implements IAppUrls {
  private readonly base: string;

  constructor(@inject(TOKENS.Env) env: Env) {
    this.base = env.APP_PUBLIC_URL.replace(/\/+$/, '');
  }

  app(): string {
    return this.base;
  }

  tag(code: string): string {
    return `${this.base}/tags/${encodeURIComponent(code)}`;
  }

  matches(): string {
    return `${this.base}/matches`;
  }

  itemsNear(lng: number, lat: number): string {
    return `${this.base}/items?lng=${lng}&lat=${lat}`;
  }

  itemDetail(id: string): string {
    return `${this.base}/items/${encodeURIComponent(id)}`;
  }
}
