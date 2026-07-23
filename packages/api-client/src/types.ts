export interface ApiClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null | Promise<string | null>;
  /** Returns the current refresh token, if the host app persists one. */
  getRefreshToken?: () => string | null | Promise<string | null>;
  /** Called with fresh tokens after a successful silent refresh. */
  onRefreshed?: (tokens: { accessToken: string; refreshToken: string }) => void;
  onUnauthorized?: () => void;
  fetchImpl?: typeof fetch;
}

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
