import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { EmptyState, ListSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';

export function VerificationsPage() {
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-verifications'],
    queryFn: () => api.listPendingVerifications(),
  });

  const decide = useMutation({
    mutationFn: (input: { id: string; decision: 'approve' | 'reject'; note?: string }) =>
      api.decideVerification(input.id, input.decision, input.note),
  });

  const items = data ?? [];
  const allSelected = items.length > 0 && items.every((v) => selectedIds.has(v.id));
  const someSelected = items.some((v) => selectedIds.has(v.id)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((v) => v.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const runBulk = async (decision: 'approve' | 'reject') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setProcessing(true);
    setProgress({ current: 0, total: ids.length });
    let failed = 0;

    for (let i = 0; i < ids.length; i++) {
      setProgress({ current: i + 1, total: ids.length });
      const id = ids[i]!;
      try {
        if (decision === 'approve') {
          await decide.mutateAsync({ id, decision: 'approve' });
        } else {
          await decide.mutateAsync({ id, decision: 'reject', note: 'Bulk reject' });
        }
      } catch {
        failed++;
      }
    }

    setSelectedIds(new Set());
    setProcessing(false);
    await qc.invalidateQueries({ queryKey: ['admin-verifications'] });
    setSnackbar({
      open: true,
      message: failed > 0 ? `Completed with ${failed} failures.` : `All ${ids.length} verifications ${decision}d.`,
      severity: failed > 0 ? 'error' : 'success',
    });
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
        <Typography variant="h4" fontWeight={700}>
          Pending ownership verifications
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleSelectAll} disabled={items.length === 0 || processing} />
          <Typography variant="body2" color="text.secondary">
            Select all
          </Typography>
        </Stack>
      </Stack>

      {selectedIds.size > 0 && (
        <Stack direction="row" spacing={1}>
          <Button variant="contained" color="success" disabled={processing} onClick={() => runBulk('approve')}>
            Approve selected ({selectedIds.size})
          </Button>
          <Button variant="outlined" color="error" disabled={processing} onClick={() => runBulk('reject')}>
            Reject selected ({selectedIds.size})
          </Button>
        </Stack>
      )}

      {processing && (
        <Stack spacing={1}>
          <LinearProgress variant="determinate" value={(progress.current / progress.total) * 100} />
          <Typography variant="caption" color="text.secondary">
            Processing {progress.current} of {progress.total}…
          </Typography>
        </Stack>
      )}

      {isLoading && <ListSkeleton rows={4} avatar={false} />}
      {data && data.length === 0 && (
        <EmptyState
          tone="teal"
          icon={<TaskAltOutlinedIcon />}
          title="Queue is clear"
          description="No claim verifications are waiting for review. New submissions will appear here."
        />
      )}

      {items.map((v) => (
        <Card key={v.id} variant="outlined">
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Stack direction="row" alignItems="center" spacing={1}>
                <Checkbox
                  checked={selectedIds.has(v.id)}
                  onChange={() => toggleSelect(v.id)}
                  disabled={processing}
                />
                <Typography variant="h6">Item {v.itemId.slice(-6)}</Typography>
              </Stack>
              <Chip label={`AI ${(v.aiConsistencyScore * 100).toFixed(0)}%`} color={v.aiConsistencyScore > 0.7 ? 'success' : 'warning'} />
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ pl: 4 }}>
              by {v.claimantId.slice(-6)} · {new Date(v.createdAt).toLocaleString()}
            </Typography>
            {v.answers.map((a, i) => (
              <Typography key={i} variant="body2" mt={1} sx={{ pl: 4 }}>
                <b>Q{i + 1}:</b> {a.answer}
              </Typography>
            ))}
            <Stack direction="row" spacing={1} mt={2} sx={{ pl: 4 }}>
              <Button
                variant="contained"
                color="success"
                size="small"
                onClick={() => decide.mutate({ id: v.id, decision: 'approve' })}
                disabled={processing}
              >
                Approve
              </Button>
              <Button
                color="error"
                size="small"
                onClick={() =>
                  decide.mutate({ id: v.id, decision: 'reject', note: 'Insufficient evidence' })
                }
                disabled={processing}
              >
                Reject
              </Button>
            </Stack>
          </CardContent>
        </Card>
      ))}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
