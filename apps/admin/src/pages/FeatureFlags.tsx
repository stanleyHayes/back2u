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
import ToggleOnOutlinedIcon from '@mui/icons-material/ToggleOnOutlined';
import ToggleOffOutlinedIcon from '@mui/icons-material/ToggleOffOutlined';
import { EmptyState, ListSkeleton, PageHeader } from '@back2u/ui-web';

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
    mutationFn: ({
      key,
      percentage,
      allowedUserIds,
    }: {
      key: string;
      percentage: number;
      allowedUserIds?: string[];
    }) => api.updateFeatureRollout(key, { rolloutPercentage: percentage, allowedUserIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feature-flags'] }),
  });

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Stack spacing={3}>
        <PageHeader
          icon={<ToggleOnOutlinedIcon />}
          title="Feature flags"
          description="Toggle features, control rollout percentage, and manage allowed users."
        />

        {error && (
          <Alert severity="error">
            {error instanceof Error ? error.message : 'Failed to load flags'}
          </Alert>
        )}

        {isLoading && <ListSkeleton rows={5} avatar={false} />}

        {data && data.length === 0 && (
          <EmptyState
            tone="teal"
            icon={<ToggleOffOutlinedIcon />}
            title="No feature flags"
            description="Flags defined on the server will appear here so you can control their rollout."
          />
        )}

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
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Box>
          <Typography sx={{ fontWeight: 700 }}>{flag.name}</Typography>
          <Typography variant="body2" color="text.secondary">
            {flag.key}
          </Typography>
          {flag.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {flag.description}
            </Typography>
          )}
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Chip
            size="small"
            label={flag.enabled ? 'Enabled' : 'Disabled'}
            color={flag.enabled ? 'success' : 'default'}
          />
          <Switch checked={flag.enabled} onChange={onToggle} disabled={togglePending} />
        </Stack>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={2}>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600 }} gutterBottom>
            Rollout: {localPercentage}%
          </Typography>
          <Slider
            value={localPercentage}
            onChange={(_e, v) => setLocalPercentage(v as number)}
            onChangeCommitted={(_e, v) =>
              onRolloutChange(
                v as number,
                localAllowed
                  ? localAllowed
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : undefined,
              )
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
              localAllowed
                ? localAllowed
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : undefined,
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
