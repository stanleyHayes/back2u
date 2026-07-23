import { createHash } from 'node:crypto';

import { injectable } from 'inversify';

import type { IPerceptualHashService } from '../../application/ports/services.js';

/**
 * Lightweight content-hash fallback (SHA-256 hex of bytes).
 *
 * Swap to a real DCT-based pHash (sharp + phash-like libs) when ready —
 * the contract here is small enough that adapter substitution is one line in the container.
 */
@injectable()
export class ShaPerceptualHash implements IPerceptualHashService {
  async hash(imageBytes: Uint8Array): Promise<string> {
    return createHash('sha256').update(imageBytes).digest('hex');
  }
  hammingDistance(a: string, b: string): number {
    if (a === b) return 0;
    let d = 0;
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i++) if (a[i] !== b[i]) d++;
    return d;
  }
  isDuplicate(a: string, b: string, threshold = 4): boolean {
    return this.hammingDistance(a, b) <= threshold;
  }
}
