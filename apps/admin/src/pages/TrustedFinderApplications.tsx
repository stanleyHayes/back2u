import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { TrustedFinderApplicationDTO } from '@back2u/shared-types';
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined';
import { AiAssistantBar, EmptyState, PageHeader } from '@back2u/ui-web';

import { api } from '../lib/api.js';

const STATUS_COLOR: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

export function TrustedFinderApplicationsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | undefined>(
    'pending',
  );
  const [decideDialog, setDecideDialog] = useState<{
    open: boolean;
    app: TrustedFinderApplicationDTO | null;
    decision: 'approved' | 'rejected';
  }>({
    open: false,
    app: null,
    decision: 'approved',
  });
  const [reason, setReason] = useState('');
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
    queryKey: ['trusted-finder-applications', statusFilter],
    queryFn: () => api.listTrustedFinderApplications(statusFilter),
  });

  const decide = useMutation({
    mutationFn: (input: { id: string; decision: 'approved' | 'rejected'; reason?: string }) =>
      api.decideTrustedFinderApplication(input.id, input.decision, input.reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trusted-finder-applications'] });
      setDecideDialog({ open: false, app: null, decision: 'approved' });
      setReason('');
      setSnackbar({ open: true, message: 'Decision saved.', severity: 'success' });
    },
    onError: (e: unknown) => {
      setSnackbar({
        open: true,
        message: e instanceof Error ? e.message : 'Failed to decide',
        severity: 'error',
      });
    },
  });

  const openDecide = (app: TrustedFinderApplicationDTO, decision: 'approved' | 'rejected') => {
    setDecideDialog({ open: true, app, decision });
    setReason('');
  };

  const closeDecide = () => {
    setDecideDialog({ open: false, app: null, decision: 'approved' });
    setReason('');
  };

  const handleDecide = () => {
    if (decideDialog.app) {
      decide.mutate({
        id: decideDialog.app.id,
        decision: decideDialog.decision,
        reason: reason || undefined,
      });
    }
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<HowToRegOutlinedIcon />}
        title="Trusted Finder Applications"
        description="Vet members applying for trusted-finder status — review their ID and bio, then approve or reject."
      />

      <Stack direction="row" spacing={1}>
        {(['pending', 'approved', 'rejected'] as const).map((s) => (
          <Button
            key={s}
            variant={statusFilter === s ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </Button>
        ))}
        <Button
          variant={statusFilter === undefined ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setStatusFilter(undefined)}
        >
          all
        </Button>
      </Stack>

      {!isLoading && (data ?? []).length === 0 ? (
        <EmptyState
          tone="teal"
          icon={<HowToRegOutlinedIcon />}
          title="No applications found"
          description="Applications matching this filter will appear here for review."
        />
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>ID Photo</TableCell>
                <TableCell>Bio</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton variant="text" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              {(data ?? []).map((app) => (
                <TableRow key={app.id} hover>
                  <TableCell>
                    <Typography variant="body2">{app.userId}</Typography>
                  </TableCell>
                  <TableCell>
                    <a href={app.idPhotoUrl} target="_blank" rel="noreferrer">
                      <img
                        src={app.idPhotoUrl}
                        alt="ID"
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 4 }}
                      />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300, whiteSpace: 'pre-wrap' }}>
                      {app.bio ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={app.status}
                      size="small"
                      color={STATUS_COLOR[app.status] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell>{new Date(app.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    {app.status === 'pending' && (
                      <Stack direction="row" spacing={0.5}>
                        <Button
                          size="small"
                          color="success"
                          onClick={() => openDecide(app, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => openDecide(app, 'rejected')}
                        >
                          Reject
                        </Button>
                      </Stack>
                    )}
                    {app.status !== 'pending' && app.reason && (
                      <Typography variant="caption" color="text.secondary">
                        {app.reason}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      <Dialog open={decideDialog.open} onClose={closeDecide} maxWidth="sm" fullWidth>
        <DialogTitle>
          {decideDialog.decision === 'approved' ? 'Approve' : 'Reject'} application
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Application from user {decideDialog.app?.userId}
            </Typography>
            <Box>
              <Stack
                direction="row"
                sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}
              >
                <Typography variant="caption" color="text.secondary">
                  Reason / note (optional)
                </Typography>
                <AiAssistantBar
                  dense
                  value={reason}
                  onChange={setReason}
                  assist={api.aiAssist.bind(api)}
                  actions={[
                    'fix_grammar',
                    'improve_clarity',
                    'formalize',
                    'make_casual',
                    'create_from_prompt',
                  ]}
                />
              </Stack>
              <TextField
                label="Reason / note (optional)"
                multiline
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                fullWidth
              />
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDecide}>Cancel</Button>
          <Button
            variant="contained"
            color={decideDialog.decision === 'approved' ? 'success' : 'error'}
            onClick={handleDecide}
            disabled={decide.isPending}
          >
            {decideDialog.decision === 'approved' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

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
