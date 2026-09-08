import {
  AdminWorkspace,
  WorkspaceHeader as PageHeader,
  QueueSummary,
  queueTable,
  queueFilters,
} from '../components/AdminWorkspace.js';
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
import { AiAssistantBar, EmptyState } from '@back2u/ui-web';

import { api } from '../lib/api.js';

const STATUS_COLOR: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
};

function TrustedFinderApplicationsPageContent() {
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

  const { data, isLoading, isError, refetch } = useQuery({
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
        title="Trusted finders"
        description="Vet members applying for trusted-finder status — review their ID and bio, then approve or reject."
      />

      <QueueSummary
        count={isLoading || isError ? undefined : data?.length}
        label="Applications in this view"
        description="Review the submitted identification and bio together."
      />

      <Stack direction="row" useFlexGap sx={queueFilters}>
        {(['pending', 'approved', 'rejected'] as const).map((s) => (
          <Button
            key={s}
            aria-pressed={statusFilter === s}
            variant={statusFilter === s ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </Button>
        ))}
        <Button
          aria-pressed={statusFilter === undefined}
          variant={statusFilter === undefined ? 'contained' : 'outlined'}
          size="small"
          onClick={() => setStatusFilter(undefined)}
        >
          all
        </Button>
      </Stack>

      {isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          Could not load this queue. Please try again.
        </Alert>
      )}
      {!isLoading && !isError && (data ?? []).length === 0 ? (
        <EmptyState
          tone="teal"
          icon={<HowToRegOutlinedIcon />}
          title="No applications found"
          description="Applications matching this filter will appear here for review."
        />
      ) : (
        <Box sx={queueTable}>
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
                        alt={`Identification submitted by ${app.userId}`}
                        style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 12 }}
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

      <Dialog
        slotProps={{
          paper: {
            sx: {
              bgcolor: 'background.default',
              borderRadius: '24px',
              backgroundImage: 'none',
              '& .MuiDialogTitle-root': { fontFamily: 'Outfit, sans-serif', fontSize: 24 },
              '& .MuiDialogActions-root': { p: 2.5, flexWrap: 'wrap', gap: 1 },
            },
          },
        }}
        open={decideDialog.open}
        onClose={closeDecide}
        maxWidth="sm"
        fullWidth
      >
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

export function TrustedFinderApplicationsPage() {
  return (
    <AdminWorkspace>
      <TrustedFinderApplicationsPageContent />
    </AdminWorkspace>
  );
}
