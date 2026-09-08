import {
  AdminWorkspace,
  WorkspaceHeader as PageHeader,
  workspacePanel,
} from '../components/AdminWorkspace.js';
import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  InputAdornment,
  LinearProgress,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BusinessRulesDTO, UpdateBusinessRulesInput } from '@back2u/shared-types';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { EmptyState } from '@back2u/ui-web';

import { api } from '../lib/api.js';

/** A single editable knob, with the spec section it comes from. */
type Field = {
  key: keyof UpdateBusinessRulesInput;
  label: string;
  help: string;
  adornment?: string;
  step?: number;
};

type Section = { heading: string; blurb: string; fields: Field[] };

const SECTIONS: Section[] = [
  {
    heading: 'Holding period',
    blurb:
      'How long earned BakPoints stay pending before they can be spent. The window is what makes a reward reversible while a dispute is still possible.',
    fields: [
      {
        key: 'pointsPendingDays',
        label: 'Standard hold',
        help: 'Days before an ordinary award clears.',
        adornment: 'days',
      },
      {
        key: 'riskExtendedPendingDays',
        label: 'Extended hold',
        help: 'Extra days applied when the risk engine asks for more time.',
        adornment: 'days',
      },
      {
        key: 'newAccountMinAgeDays',
        label: 'New-account threshold',
        help: 'Accounts younger than this are treated as new.',
        adornment: 'days',
      },
      {
        key: 'newAccountRewardDelayDays',
        label: 'New-account delay',
        help: 'Extra days added to a new account’s first rewards.',
        adornment: 'days',
      },
    ],
  },
  {
    heading: 'Earning caps',
    blurb:
      'Rolling limits that bound how much any one account can earn. Set a cap to 0 to disable it.',
    fields: [
      { key: 'dailyPointCap', label: 'Daily cap', help: 'Points earnable in 24 hours.' },
      { key: 'weeklyPointCap', label: 'Weekly cap', help: 'Points earnable in 7 days.' },
      { key: 'monthlyPointCap', label: 'Monthly cap', help: 'Points earnable in 30 days.' },
    ],
  },
  {
    heading: 'Anti-gaming',
    blurb:
      'Multipliers that reduce the value of repeated or unusually frequent recoveries between the same people.',
    fields: [
      {
        key: 'repeatPairFreeCount',
        label: 'Free repeats',
        help: 'Recoveries with the same counterparty before the penalty applies.',
      },
      {
        key: 'repeatPairPenalty',
        label: 'Repeat-pair multiplier',
        help: 'Applied beyond the free count. 0.5 halves the award.',
        step: 0.05,
      },
      {
        key: 'diminishingReturnsAfter',
        label: 'Frequency threshold',
        help: 'Recoveries in 30 days before diminishing returns start.',
      },
      {
        key: 'diminishingReturnsFactor',
        label: 'Diminishing multiplier',
        help: 'Applied past the frequency threshold.',
        step: 0.05,
      },
    ],
  },
  {
    heading: 'Rewards & campaigns',
    blurb: 'Platform economics for owner-funded cash rewards and temporary partner-funded boosts.',
    fields: [
      {
        key: 'rewardPlatformFeeRate',
        label: 'Platform fee',
        help: 'Share of a cash reward retained by the platform. 0.1 is 10%.',
        step: 0.01,
      },
      {
        key: 'campaignMultiplier',
        label: 'Campaign multiplier',
        help: 'Applied to every award while a campaign window is open. 1 is off.',
        step: 0.05,
      },
      {
        key: 'highValueThresholdMinor',
        label: 'High-value threshold',
        help: 'Item value above which enhanced verification applies, in pesewas.',
      },
    ],
  },
];

/**
 * Human labels for the point actions. The API keys are snake_case internals;
 * showing them raw makes an operator guess whether "recovery ordinary" and
 * "recovery device" are two settings or one.
 */
const ACTION_COPY: Record<string, { label: string; help: string }> = {
  profile_completed: { label: 'Completed profile', help: 'One-off, after identity checks.' },
  found_item_reported: {
    label: 'Reported a found item',
    help: 'Pending; duplicates earn nothing.',
  },
  recovery_point_deposit: {
    label: 'Deposited at a Recovery Point',
    help: 'Earned by the finder when a partner takes custody.',
  },
  recovery_ordinary: { label: 'Recovered an ordinary item', help: 'The base recovery award.' },
  recovery_document: { label: 'Recovered an ID or document', help: 'Passports, licences, cards.' },
  recovery_device: { label: 'Recovered a phone or laptop', help: 'Not tied to market value.' },
  owner_confirmed_recovery: {
    label: 'Owner confirmed a recovery',
    help: 'Deliberately small — it is the weakest evidence there is.',
  },
  milestone_bonus: { label: 'Milestone bonus', help: 'For campaigns and streaks.' },
  fraud_penalty: {
    label: 'Confirmed fraud penalty',
    help: 'Deducted from both participants. Enter it as a positive number.',
  },
  redemption_spend: { label: 'Redemption', help: 'Set by the redemption itself; leave at 0.' },
  admin_adjustment: { label: 'Manual adjustment', help: 'Set per adjustment; leave at 0.' },
};

const VERIFICATION_LABELS: { key: string; label: string; help: string }[] = [
  { key: 'peer', label: 'Peer return', help: 'Owner and finder meet directly. Weakest evidence.' },
  {
    key: 'recovery_point',
    label: 'Recovery Point',
    help: 'Finder deposits; a partner accepts and releases.',
  },
  {
    key: 'verified_delivery',
    label: 'Verified delivery',
    help: 'Tracked partner or courier collection and delivery.',
  },
  {
    key: 'institutional',
    label: 'Institutional',
    help: 'Police, university, mall, hospital or transport operator.',
  },
];

/** Numeric input that keeps an empty string editable instead of snapping to 0. */
function NumberField(props: {
  label: string;
  help: string;
  value: number | undefined;
  onChange: (v: number) => void;
  adornment?: string;
  step?: number;
}) {
  return (
    <TextField
      size="small"
      type="number"
      label={props.label}
      helperText={props.help}
      value={props.value ?? ''}
      onChange={(e) => {
        const next = Number(e.target.value);
        if (Number.isFinite(next)) props.onChange(next);
      }}
      slotProps={{
        htmlInput: { step: props.step ?? 1 },
        input: props.adornment
          ? { endAdornment: <InputAdornment position="end">{props.adornment}</InputAdornment> }
          : undefined,
      }}
      sx={{ minWidth: 220, flex: '1 1 220px' }}
    />
  );
}

function BusinessRulesPageContent() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<BusinessRulesDTO | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-business-rules'],
    queryFn: () => api.getBusinessRules(),
  });

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const save = useMutation({
    mutationFn: (input: UpdateBusinessRulesInput) => api.updateBusinessRules(input),
    onSuccess: (result) => {
      setDraft(result);
      void qc.invalidateQueries({ queryKey: ['admin-business-rules'] });
      setSnackbar({
        open: true,
        message: 'Rules updated. New awards use them immediately.',
        severity: 'success',
      });
    },
    onError: (err: Error) => setSnackbar({ open: true, message: err.message, severity: 'error' }),
  });

  if (isLoading || !draft) {
    return (
      <Stack spacing={3}>
        <PageHeader
          icon={<TuneOutlinedIcon />}
          title="Business rules"
          description="The BakPoints economy. Nothing here is hardcoded — every change applies to the next award and is recorded on the audit trail."
        />
        {/* Shaped like the panels that replace it, so the page does not jump. */}
        {Array.from({ length: 4 }).map((_, i) => (
          <Paper key={i} variant="outlined" sx={{ ...workspacePanel, border: 0 }}>
            <Skeleton variant="text" width={180} height={28} />
            <Skeleton variant="text" width="70%" />
            <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap', mt: 2 }}>
              {Array.from({ length: 4 }).map((__, k) => (
                <Skeleton key={k} variant="rounded" height={56} sx={{ flex: '1 1 220px' }} />
              ))}
            </Stack>
          </Paper>
        ))}
      </Stack>
    );
  }

  if (isError) {
    return (
      <Stack spacing={3}>
        <PageHeader icon={<TuneOutlinedIcon />} title="Business rules" description="" />
        <EmptyState
          tone="clay"
          icon={<TuneOutlinedIcon />}
          title="Could not load the rules"
          description="The BakPoints configuration is temporarily unavailable."
          actions={[{ label: 'Retry', onClick: () => void refetch() }]}
        />
      </Stack>
    );
  }

  const setField = (key: keyof UpdateBusinessRulesInput, value: number) =>
    setDraft((d) => (d ? ({ ...d, [key]: value } as BusinessRulesDTO) : d));

  const submit = () => {
    // Send only the scalar knobs plus the two keyed groups; the server merges
    // field-by-field, so an untouched knob is simply not included.
    const input: UpdateBusinessRulesInput = {
      pointsPerAction: draft.pointsPerAction,
      verificationMultipliers: draft.verificationMultipliers,
      riskThresholds: draft.riskThresholds,
    };
    for (const section of SECTIONS) {
      for (const f of section.fields) {
        (input as Record<string, unknown>)[f.key] = draft[f.key as keyof BusinessRulesDTO];
      }
    }
    save.mutate(input);
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<TuneOutlinedIcon />}
        title="Business rules"
        description="The BakPoints economy. Nothing here is hardcoded — every change applies to the next award and is recorded on the audit trail."
      />

      {save.isPending ? <LinearProgress /> : null}

      <Alert severity="info">
        Last changed {new Date(draft.updatedAt).toLocaleString()}
        {draft.updatedBy ? ` by ${draft.updatedBy.slice(-6)}` : ''}.
      </Alert>

      <Paper variant="outlined" sx={{ ...workspacePanel, border: 0 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontFamily: 'Outfit, sans-serif', fontSize: 21, fontWeight: 600, mb: 0.5 }}
        >
          Points per action
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Base award for each verified action, before any multiplier or cap.
        </Typography>
        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {Object.entries(draft.pointsPerAction).map(([action, points]) => (
            <NumberField
              key={action}
              label={ACTION_COPY[action]?.label ?? action.replace(/_/g, ' ')}
              help={ACTION_COPY[action]?.help ?? ''}
              value={points}
              onChange={(v) =>
                setDraft((d) =>
                  d ? { ...d, pointsPerAction: { ...d.pointsPerAction, [action]: v } } : d,
                )
              }
            />
          ))}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ ...workspacePanel, border: 0 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontFamily: 'Outfit, sans-serif', fontSize: 21, fontWeight: 600, mb: 0.5 }}
        >
          Verification multipliers
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          How much each evidence path is worth. A recovery nobody witnessed should never be worth as
          much as one a partner recorded.
        </Typography>
        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {VERIFICATION_LABELS.map((v) => (
            <NumberField
              key={v.key}
              label={v.label}
              help={v.help}
              step={0.05}
              value={
                draft.verificationMultipliers[v.key as keyof typeof draft.verificationMultipliers]
              }
              onChange={(next) =>
                setDraft((d) =>
                  d
                    ? {
                        ...d,
                        verificationMultipliers: { ...d.verificationMultipliers, [v.key]: next },
                      }
                    : d,
                )
              }
            />
          ))}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ ...workspacePanel, border: 0 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontFamily: 'Outfit, sans-serif', fontSize: 21, fontWeight: 600, mb: 0.5 }}
        >
          Risk thresholds
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Where each risk band begins. Must increase left to right — medium, then high, then
          critical.
        </Typography>
        <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
          {(['mediumFrom', 'highFrom', 'criticalFrom'] as const).map((k) => (
            <NumberField
              key={k}
              label={k.replace('From', '')}
              help={
                k === 'mediumFrom'
                  ? 'Extends the reward delay.'
                  : k === 'highFrom'
                    ? 'Holds rewards for manual review.'
                    : 'Freezes rewards and flags linked accounts.'
              }
              value={draft.riskThresholds[k]}
              onChange={(next) =>
                setDraft((d) =>
                  d ? { ...d, riskThresholds: { ...d.riskThresholds, [k]: next } } : d,
                )
              }
            />
          ))}
        </Stack>
      </Paper>

      {SECTIONS.map((section) => (
        <Paper key={section.heading} variant="outlined" sx={{ ...workspacePanel, border: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{ fontFamily: 'Outfit, sans-serif', fontSize: 21, fontWeight: 600, mb: 0.5 }}
          >
            {section.heading}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {section.blurb}
          </Typography>
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }}>
            {section.fields.map((f) => (
              <NumberField
                key={String(f.key)}
                label={f.label}
                help={f.help}
                adornment={f.adornment}
                step={f.step}
                value={draft[f.key as keyof BusinessRulesDTO] as number | undefined}
                onChange={(v) => setField(f.key, v)}
              />
            ))}
          </Stack>
        </Paper>
      ))}

      <Divider />
      <Box
        sx={{
          ...workspacePanel,
          position: 'sticky',
          bottom: 16,
          zIndex: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          Review your changes before applying them.
        </Typography>
        <Button variant="contained" onClick={submit} disabled={save.isPending}>
          Save rules
        </Button>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Stack>
  );
}

export function BusinessRulesPage() {
  return (
    <AdminWorkspace>
      <BusinessRulesPageContent />
    </AdminWorkspace>
  );
}
