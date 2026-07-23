import type { Id } from '../shared/id.js';

export interface FeatureFlagSnapshot {
  id: Id;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  allowedUserIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class FeatureFlag {
  private constructor(private state: FeatureFlagSnapshot) {}

  static create(input: {
    id: Id;
    key: string;
    name: string;
    description?: string;
    enabled?: boolean;
    rolloutPercentage?: number;
    allowedUserIds?: string[];
  }): FeatureFlag {
    const now = new Date();
    return new FeatureFlag({
      id: input.id,
      key: input.key,
      name: input.name,
      description: input.description,
      enabled: input.enabled ?? false,
      rolloutPercentage: input.rolloutPercentage ?? 0,
      allowedUserIds: input.allowedUserIds ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  static rehydrate(s: FeatureFlagSnapshot): FeatureFlag {
    return new FeatureFlag({ ...s });
  }

  get snapshot(): FeatureFlagSnapshot {
    return { ...this.state };
  }

  toggle(): void {
    this.state.enabled = !this.state.enabled;
    this.state.updatedAt = new Date();
  }

  setRollout(percentage: number, allowedUserIds?: string[]): void {
    this.state.rolloutPercentage = Math.max(0, Math.min(100, percentage));
    if (allowedUserIds !== undefined) {
      this.state.allowedUserIds = allowedUserIds;
    }
    this.state.updatedAt = new Date();
  }

  isEnabledForUser(userId?: string): boolean {
    if (!this.state.enabled) return false;
    if (!userId) return this.state.rolloutPercentage >= 100;
    if (this.state.allowedUserIds.includes(userId)) return true;
    if (this.state.rolloutPercentage >= 100) return true;
    if (this.state.rolloutPercentage <= 0) return false;
    return consistentHash(userId, this.state.key) < this.state.rolloutPercentage;
  }
}

/** Deterministic 0-99 hash from userId + flagKey for consistent rollout. */
function consistentHash(userId: string, flagKey: string): number {
  let hash = 0;
  const str = `${userId}:${flagKey}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) % 100;
}
