import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RiskAssessmentDTO, RiskReviewStatus, UserDTO } from '@back2u/shared-types';
import PolicyOutlinedIcon from '@mui/icons-material/PolicyOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { EmptyState, PageHeader, TableSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';

const BAND_COLOR: Record<string, 'default' | 'info' | 'warning' | 'error'> = {
  low: 'default',
  medium: 'info',
  high: 'warning',
  critical: 'error',
};

const ACTION_LABEL: Record<string, string> = {
  clear: 'Cleared automatically',
  extend_hold: 'Reward delay extended',
  manual_review: 'Awaiting review',
  freeze: 'Rewards frozen',
};

/** Plain-English names for the private rule codes. Weights stay hidden. */
const RULE_LABEL: Record<string, string> = {
  repeat_pair: 'Repeated owner/finder pairing',
  reciprocal_recovery: 'Reciprocal recoveries',
  shared_device: 'Shared device',
  shared_payout: 'Shared payout destination',
  new_account: 'Newly created account',
  fast_turnaround: 'Implausibly fast turnaround',
  high_value_frequency: 'Frequent high-value recoveries',
  duplicate_media: 'Reused images or description',
  partner_concentration: 'Concentrated through one partner',
  dispute_history: 'Prior disputes or reversals',
  peer_only_high_value: 'High-value item, no independent evidence',
};

type Decision = Exclude<RiskReviewStatus, 'open'>;

const DECISIONS: {
  value: Decision;
  label: string;
  help: string;
  color: 'success' | 'error' | 'inherit';
}[] = [
  {
    value: 'cleared',
    label: 'Clear',
    help: 'Legitimate recovery — release the held BakPoints and any cash reward.',
    color: 'success',
  },
  {
    value: 'confirmed_fraud',
    label: 'Confirm fraud',
    help: 'Reverses every award on this recovery and suspends BOTH participants.',
    color: 'error',
  },
  {
    value: 'dismissed',
    label: 'Dismiss',
    help: 'Close without a finding. Held rewards are released.',
    color: 'inherit',
  },
];

export function TrustSafetyPage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<RiskAssessmentDTO | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState('');
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-risk-queue'],
    queryFn: () => api.listOpenRiskAssessments({ pageSize: 50 }),
  });

  // Deciding a collusion case on two truncated ids is guesswork; the reviewer
  // needs to see who these people actually are. Same join the audit log uses.
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.listUsers({ limit: 1000 }),
    staleTime: 5 * 60 * 1000,
  });

  const userMap = useMemo(() => {
    const map = new Map<string, UserDTO>();
    users?.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const nameOf = (id: string): string => userMap.get(id)?.name ?? id.slice(-6);
  const emailOf = (id: string): string | undefined => userMap.get(id)?.email;

  const review = useMutation({
    mutationFn: (input: { id: string; decision: Decision; note?: string }) =>
      api.reviewRiskAssessment(input.id, { decision: input.decision, note: input.note }),
    onSuccess: (_result, input) => {
      void qc.invalidateQueries({ queryKey: ['admin-risk-queue'] });
      setSnackbar({
        open: true,
        message:
          input.decision === 'confirmed_fraud'
            ? 'Fraud confirmed — awards reversed and both accounts suspended.'
            : 'Recovery reviewed. Held rewards will clear on the next pass.',
        severity: 'success',
      });
      closeDialog();
    },
    onError: (err: Error) => {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    },
  });

  const closeDialog = () => {
    setSelected(null);
    setDecision(null);
    setNote('');
  };

  const items = data?.items ?? [];

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<PolicyOutlinedIcon />}
        title="Trust & Safety"
        description="Recoveries the anti-collusion engine held for a human decision. Scores and rule weights are never shown outside this console."
      />

      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : isError ? (
        <EmptyState
          tone="clay"
          icon={<PolicyOutlinedIcon />}
          title="Could not load the review queue"
          description="The Trust & Safety queue is temporarily unavailable."
          actions={[{ label: 'Retry', onClick: () => void refetch() }]}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<TaskAltOutlinedIcon />}
          title="Nothing waiting"
          description="No recovery is currently held for review. Low and medium-risk recoveries clear on their own."
        />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Risk</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Signals</TableCell>
                <TableCell>Owner</TableCell>
                <TableCell>Finder</TableCell>
                <TableCell>Held since</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell>
                    <Chip size="small" label={a.band} color={BAND_COLOR[a.band] ?? 'default'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {a.score}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      {a.ruleHits.slice(0, 3).map((h) => (
                        <Chip
                          key={h.code}
                          size="small"
                          variant="outlined"
                          label={RULE_LABEL[h.code] ?? h.code}
                        />
                      ))}
                      {a.ruleHits.length > 3 ? (
                        <Chip size="small" label={`+${a.ruleHits.length - 3}`} />
                      ) : null}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{nameOf(a.ownerId)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {emailOf(a.ownerId) ?? a.ownerId.slice(-6)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{nameOf(a.finderId)}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {emailOf(a.finderId) ?? a.finderId.slice(-6)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={new Date(a.createdAt).toLocaleString()}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {new Date(a.createdAt).toLocaleDateString()}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setSelected(a)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <Dialog open={selected !== null} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Review recovery</DialogTitle>
        {review.isPending ? <LinearProgress /> : null}
        <DialogContent dividers>
          {selected ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Chip
                  size="small"
                  label={selected.band}
                  color={BAND_COLOR[selected.band] ?? 'default'}
                />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Score {selected.score} · {ACTION_LABEL[selected.action] ?? selected.action}
                </Typography>
              </Stack>

              <Typography variant="body2">
                <strong>{nameOf(selected.ownerId)}</strong> reported the loss;{' '}
                <strong>{nameOf(selected.finderId)}</strong> reported the find.
              </Typography>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Why this was held
                </Typography>
                <Stack spacing={0.5}>
                  {selected.ruleHits.map((h) => (
                    <Box key={h.code}>
                      <Typography variant="body2">{RULE_LABEL[h.code] ?? h.code}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {h.detail}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>

              <Divider />

              <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                {DECISIONS.map((d) => (
                  <Tooltip key={d.value} title={d.help}>
                    <Button
                      size="small"
                      variant={decision === d.value ? 'contained' : 'outlined'}
                      color={d.color === 'inherit' ? 'inherit' : d.color}
                      onClick={() => setDecision(d.value)}
                    >
                      {d.label}
                    </Button>
                  </Tooltip>
                ))}
              </Stack>

              {decision ? (
                <Alert severity={decision === 'confirmed_fraud' ? 'warning' : 'info'}>
                  {DECISIONS.find((d) => d.value === decision)?.help}
                </Alert>
              ) : null}

              <TextField
                label="Reviewer note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                multiline
                minRows={2}
                fullWidth
                helperText="Recorded on the audit trail with your decision."
              />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} disabled={review.isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={!selected || !decision || review.isPending}
            onClick={() =>
              selected &&
              decision &&
              review.mutate({ id: selected.id, decision, note: note.trim() || undefined })
            }
          >
            Submit decision
          </Button>
        </DialogActions>
      </Dialog>

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
