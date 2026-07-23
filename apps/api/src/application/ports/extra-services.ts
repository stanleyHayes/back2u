export interface ITwilioSignatureVerifier {
  verify(signature: string | undefined, url: string, params: Record<string, string>): boolean;
}

/** Builds links into the public web app for emails/SMS/push. Env-driven for white-label/staging. */
export interface IAppUrls {
  /** Base URL of the web app, e.g. https://back2u.app */
  app(): string;
  /** Public QR scan / tag landing page for a tag code. */
  tag(code: string): string;
  /** The user's matches page. */
  matches(): string;
  /** The items feed centred near a coordinate. */
  itemsNear(lng: number, lat: number): string;
  /** Public item detail page. */
  itemDetail(id: string): string;
}

export interface IScheduler {
  every(ms: number, fn: () => Promise<void> | void, label: string): void;
  start(): void;
  stop(): void;
}

export interface IWebPushService {
  send(subscription: unknown, title: string, body: string, data?: Record<string, unknown>): Promise<void>;
  vapidPublicKey(): string | null;
}
