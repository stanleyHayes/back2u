import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Slider,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ListSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';

export function FeatureFlagsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: () => api.listFeatureFlags(),
  });

  const toggle = useMutation({
    mutationFn: (key: string) => api.toggleFeatureFlag(key),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flags'] }),
  });

  const rollout = useMutation({
    mutationFn: ({ key, percentage, allowedUserIds }: { key: string; percentage: number; allowedUserIds?: string[] }) =>
      api.updateFeatureRollout(key, { rolloutPercentage: percentage, allowedUserIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flags'] }),
  });

  return (
    <Box sx={{ maxWidth: 900 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Feature flags
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Toggle features, control rollout percentage, and manage allowed users.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error instanceof Error ? error.message : 'Failed to load flags'}
        </Alert>
      )}

      {isLoading && <ListSkeleton rows={5} avatar={false} />}

      <Stack spacing={2}>
        {data?.map((flag) => (
          <FlagCard
            key={flag.key}
            flag={flag}
            onToggle={() => toggle.mutate(flag.key)}
            onRolloutChange={(percentage, allowedUserIds) =>
              rollout.mutate({ key: flag.key, percentage, allowedUserIds })
            }
            togglePending={toggle.isPending && toggle.variables === flag.key}
            rolloutPending={rollout.isPending && rollout.variables?.key === flag.key}
          />
        ))}
      </Stack>
    </Box>
  );
}

function FlagCard({
  flag,
  onToggle,
  onRolloutChange,
  togglePending,
  rolloutPending,
}: {
  flag: import('@back2u/shared-types').FeatureFlagWithStatusDTO;
  onToggle: () => void;
  onRolloutChange: (percentage: number, allowedUserIds?: string[]) => void;
  togglePending: boolean;
  rolloutPending: boolean;
}) {
  const [localPercentage, setLocalPercentage] = useState(flag.rolloutPercentage);
  const [localAllowed, setLocalAllowed] = useState(flag.allowedUserIds.join(', '));

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Box>
          <Typography fontWeight={700}>{flag.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {flag.key}
          </Typography>
          {flag.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {flag.description}
            </Typography>
          )}
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip
            size="small"
            label={flag.enabled ? 'Enabled' : 'Disabled'}
            color={flag.enabled ? 'success' : 'default'}
          />
          <Switch
            checked={flag.enabled}
            onChange={onToggle}
            disabled={togglePending}
          />
        </Stack>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={2}>
        <Box>
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Rollout: {localPercentage}%
          </Typography>
          <Slider
            value={localPercentage}
            onChange={(_e, v) => setLocalPercentage(v as number)}
            onChangeCommitted={(_e, v) =>
              onRolloutChange(v as number, localAllowed ? localAllowed.split(',').map((s) => s.trim()).filter(Boolean) : undefined)
            }
            min={0}
            max={100}
            step={1}
            disabled={rolloutPending}
            valueLabelDisplay="auto"
          />
        </Box>

        <TextField
          label="Allowed user IDs (comma-separated)"
          value={localAllowed}
          onChange={(e) => setLocalAllowed(e.target.value)}
          onBlur={() =>
            onRolloutChange(
              localPercentage,
              localAllowed ? localAllowed.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
            )
          }
          disabled={rolloutPending}
          size="small"
          fullWidth
          helperText="These users always see the feature when it is enabled."
        />
      </Stack>
    </Paper>
  );
}
