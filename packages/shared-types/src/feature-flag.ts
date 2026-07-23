export interface FeatureFlagDTO {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  allowedUserIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FeatureFlagWithStatusDTO extends FeatureFlagDTO {
  isEnabledForUser: boolean;
}

export interface UpdateRolloutInput {
  rolloutPercentage: number;
  allowedUserIds?: string[];
}
