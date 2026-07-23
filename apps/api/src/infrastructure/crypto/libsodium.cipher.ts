import { inject, injectable } from 'inversify';
import sodium from 'libsodium-wrappers';

import type { IVaultCipher } from '../../application/ports/crypto.js';
import type { ILogger } from '../../application/ports/services.js';
import { TOKENS } from '../../application/ports/tokens.js';
import type { Env } from '../../config/env.js';

@injectable()
export class LibsodiumVaultCipher implements IVaultCipher {
  private key: Uint8Array | null = null;
  private ready = false;
  private initPromise: Promise<void> | null = null;

  constructor(
    @inject(TOKENS.Env) private readonly env: Env,
    @inject(TOKENS.Logger) private readonly logger: ILogger,
  ) {}

  isReady(): boolean {
    return this.ready;
  }

  /**
   * Lazy, memoized init. The same promise is returned on every call, so an
   * invalid VAULT_MASTER_KEY surfaces as a rejected promise on first use
   * (encrypt/decrypt) instead of an unhandled rejection from the constructor.
   */
  private ensureInit(): Promise<void> {
    this.initPromise ??= this.init();
    return this.initPromise;
  }

  private async init(): Promise<void> {
    await sodium.ready;
    if (!this.env.VAULT_MASTER_KEY) {
      this.logger.warn('vault cipher disabled (no VAULT_MASTER_KEY)');
      return;
    }
    const raw = Buffer.from(this.env.VAULT_MASTER_KEY, 'base64');
    if (raw.length !== sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES) {
      throw new Error(`VAULT_MASTER_KEY must decode to ${sodium.crypto_aead_xchacha20poly1305_ietf_KEYBYTES} bytes`);
    }
    this.key = new Uint8Array(raw);
    this.ready = true;
  }

  async encrypt(plaintext: string, aad = ''): Promise<string> {
    await this.ensureInit();
    if (!this.key) throw new Error('Vault cipher not configured');
    const nonce = sodium.randombytes_buf(sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES);
    const cipher = sodium.crypto_aead_xchacha20poly1305_ietf_encrypt(
      sodium.from_string(plaintext),
      sodium.from_string(aad),
      null,
      nonce,
      this.key,
    );
    return `v1.${Buffer.from(nonce).toString('base64')}.${Buffer.from(cipher).toString('base64')}`;
  }

  async decrypt(blob: string, aad = ''): Promise<string> {
    await this.ensureInit();
    if (!this.key) throw new Error('Vault cipher not configured');
    const [v, nonceB64, cipherB64] = blob.split('.');
    if (v !== 'v1' || !nonceB64 || !cipherB64) throw new Error('Bad ciphertext format');
    const nonce = new Uint8Array(Buffer.from(nonceB64, 'base64'));
    const cipher = new Uint8Array(Buffer.from(cipherB64, 'base64'));
    const plain = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
      null,
      cipher,
      sodium.from_string(aad),
      nonce,
      this.key,
    );
    return sodium.to_string(plain);
  }
}
