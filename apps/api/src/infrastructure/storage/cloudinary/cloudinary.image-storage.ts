import { inject, injectable } from 'inversify';
import { v2 as cloudinary } from 'cloudinary';

import type { IImageStorage, ILogger, UploadSignature } from '../../../application/ports/services.js';
import { TOKENS } from '../../../application/ports/tokens.js';
import type { Env } from '../../../config/env.js';

@injectable()
export class CloudinaryImageStorage implements IImageStorage {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly enabled: boolean;

  constructor(
    @inject(TOKENS.Env) env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {
    this.cloudName = env.CLOUDINARY_CLOUD_NAME ?? '';
    this.apiKey = env.CLOUDINARY_API_KEY ?? '';
    this.apiSecret = env.CLOUDINARY_API_SECRET ?? '';
    this.enabled = Boolean(this.cloudName && this.apiKey && this.apiSecret);
    if (this.enabled) {
      cloudinary.config({ cloud_name: this.cloudName, api_key: this.apiKey, api_secret: this.apiSecret });
    }
  }

  signUpload(folder: string): UploadSignature {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = this.enabled
      ? cloudinary.utils.api_sign_request({ timestamp, folder }, this.apiSecret)
      : '';
    if (!this.enabled) {
      this.logger.warn('cloudinary signUpload noop (no keys)', { folder });
    }
    return {
      signature,
      timestamp,
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      folder,
    };
  }

  async fetchBytes(publicUrl: string): Promise<Uint8Array> {
    const res = await fetch(publicUrl);
    if (!res.ok) {
      throw new Error(`fetchBytes failed: ${res.status} for ${publicUrl}`);
    }
    return new Uint8Array(await res.arrayBuffer());
  }
}
