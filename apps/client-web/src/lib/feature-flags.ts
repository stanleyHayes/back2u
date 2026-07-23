import type { FeatureFlagWithStatusDTO } from '@back2u/shared-types';

/** Deterministic 0-99 hash from userId + flagKey for consistent rollout. */
export function consistentHash(userId: string, flagKey: string): number {
  let hash = 0;
  const str = `${userId}:${flagKey}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) % 100;
}

export function isFlagEnabled(
  flags: FeatureFlagWithStatusDTO[],
  key: string,
  userId?: string,
): boolean {
  const flag = flags.find((f) => f.key === key);
  if (!flag) return false;
  if (!flag.enabled) return false;
  if (!userId) return flag.rolloutPercentage >= 100;
  if (flag.allowedUserIds.includes(userId)) return true;
  if (flag.rolloutPercentage >= 100) return true;
  if (flag.rolloutPercentage <= 0) return false;
  return consistentHash(userId, key) < flag.rolloutPercentage;
}
