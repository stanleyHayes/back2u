import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  LinearProgress,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SafetyReportDTO } from '@back2u/shared-types';

import { api } from '../lib/api.js';

const REASON_COLOR: Record<string, 'default' | 'error' | 'warning' | 'info'> = {
  scam: 'error',
  harassment: 'error',
  spam: 'warning',
  inappropriate: 'warning',
  other: 'default',
};

const STATUS_COLOR: Record<string, 'default' | 'success' | 'error' | 'info'> = {
  open: 'info',
  actioned: 'success',
  dismissed: 'default',
  resolved: 'success',
};

export function SafetyReportsPage() {
  const qc = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-safety-reports'],
    queryFn: () => api.listOpenReports() as Promise<SafetyReportDTO[]>,
  });

  const decide = useMutation({
    mutationFn: (input: { id: string; decision: 'resolved'; note?: string }) =>
      api.decideReport(input.id, input.decision, input.note),
  });

  const items = data ?? [];
  const allSelected = items.length > 0 && items.every((r) => selectedIds.has(r.id));
  const someSelected = items.some((r) => selectedIds.has(r.id)) && !allSelected;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((r) => r.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const runBulk = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setProcessing(true);
    setProgress({ current: 0, total: ids.length });
    let failed = 0;

    for (let i = 0; i < ids.length; i++) {
      setProgress({ current: i + 1, total: ids.length });
      try {
        await decide.mutateAsync({ id: ids[i], decision: 'resolved' } as {
          id: string;
          decision: 'resolved';
        });
      } catch {
        failed++;
      }
    }

    setSelectedIds(new Set());
    setProcessing(false);
    await qc.invalidateQueries({ queryKey: ['admin-safety-reports'] });
    setSnackbar({
      open: true,
      message:
        failed > 0 ? `Completed with ${failed} failures.` : `All ${ids.length} reports resolved.`,
      severity: failed > 0 ? 'error' : 'success',
    });
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4" sx={{ fontWeight: 700 }}>
        Safety Reports
      </Typography>

      {selectedIds.size > 0 && (
        <Stack direction="row" spacing={1}>
          <Button variant="contained" color="success" disabled={processing} onClick={runBulk}>
            Resolve selected ({selectedIds.size})
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

      {isLoading && (
        <Stack spacing={1}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} />
          ))}
        </Stack>
      )}

      {data && data.length === 0 && <Alert severity="success">No open reports.</Alert>}

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={toggleSelectAll}
                  disabled={items.length === 0 || processing}
                />
              </TableCell>
              <TableCell>Target</TableCell>
              <TableCell>Target ID</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((report) => (
              <TableRow key={report.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.has(report.id)}
                    onChange={() => toggleSelect(report.id)}
                    disabled={processing}
                  />
                </TableCell>
                <TableCell>{report.target}</TableCell>
                <TableCell>{report.targetId.slice(-8)}</TableCell>
                <TableCell>
                  <Chip
                    label={report.reason}
                    size="small"
                    color={REASON_COLOR[report.reason] ?? 'default'}
                  />
                </TableCell>
                <TableCell>{report.note ?? '—'}</TableCell>
                <TableCell>
                  <Chip
                    label={report.status}
                    size="small"
                    color={STATUS_COLOR[report.status] ?? 'default'}
                  />
                </TableCell>
                <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    disabled={processing || report.status !== 'open'}
                    onClick={() => decide.mutate({ id: report.id, decision: 'resolved' })}
                  >
                    Resolve
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}
