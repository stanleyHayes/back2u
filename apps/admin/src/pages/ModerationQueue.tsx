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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
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
import type { ModerationQueueItemDTO } from '@back2u/shared-types';
import GavelOutlinedIcon from '@mui/icons-material/GavelOutlined';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import { EmptyState } from '@back2u/ui-web';

import { api } from '../lib/api.js';

const TYPE_COLOR: Record<string, 'default' | 'primary' | 'secondary'> = {
  item: 'primary',
  message: 'secondary',
  user: 'default',
};

const STATUS_COLOR: Record<string, 'default' | 'warning' | 'success'> = {
  pending: 'warning',
  reviewed: 'success',
};

function ModerationQueuePageContent() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [detailItem, setDetailItem] = useState<ModerationQueueItemDTO | null>(null);
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
    queryKey: ['admin-moderation-queue', typeFilter, statusFilter],
    queryFn: () =>
      api.listModerationQueue({ type: typeFilter || undefined, status: statusFilter || undefined }),
  });

  const review = useMutation({
    mutationFn: (input: { id: string; decision: 'approve' | 'remove' }) =>
      api.reviewModerationItem(input.id, input.decision),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-moderation-queue'] });
      setDetailItem(null);
      setSnackbar({ open: true, message: 'Decision saved.', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to save decision.', severity: 'error' });
    },
  });

  const items = data ?? [];

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<GavelOutlinedIcon />}
        title="Moderation queue"
        description="Review flagged items, messages and users, then approve or remove them."
      />

      <QueueSummary
        count={isLoading || isError ? undefined : data?.length}
        label="Flags in this view"
        description="Use content type and review status to focus your queue."
      />

      <Stack direction="row" useFlexGap sx={queueFilters}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="moderation-type-label" shrink>
            Content type
          </InputLabel>
          <Select
            labelId="moderation-type-label"
            displayEmpty
            value={typeFilter}
            label="Content type"
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="item">Item</MenuItem>
            <MenuItem value="message">Message</MenuItem>
            <MenuItem value="user">User</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="moderation-status-label" shrink>
            Review status
          </InputLabel>
          <Select
            labelId="moderation-status-label"
            displayEmpty
            value={statusFilter}
            label="Review status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="reviewed">Reviewed</MenuItem>
          </Select>
        </FormControl>
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
      {isLoading && (
        <Stack spacing={1}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} />
          ))}
        </Stack>
      )}

      {!isLoading && !isError && items.length === 0 ? (
        <EmptyState
          tone="teal"
          icon={<TaskAltOutlinedIcon />}
          title="Queue is clear"
          description="Nothing is waiting for review. Flagged content will appear here when it needs a decision."
        />
      ) : (
        <Box sx={queueTable}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Target ID</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    <Chip
                      label={item.type}
                      size="small"
                      color={TYPE_COLOR[item.type] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell>{item.targetId.slice(-8)}</TableCell>
                  <TableCell>{item.reason}</TableCell>
                  <TableCell>{item.score.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.status}
                      size="small"
                      color={STATUS_COLOR[item.status] ?? 'default'}
                    />
                  </TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" onClick={() => setDetailItem(item)}>
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}

      {detailItem && (
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
          open
          onClose={() => setDetailItem(null)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Review Moderation Item</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <Stack direction="row" spacing={1}>
                <Chip
                  label={detailItem.type}
                  size="small"
                  color={TYPE_COLOR[detailItem.type] ?? 'default'}
                />
                <Chip
                  label={detailItem.status}
                  size="small"
                  color={STATUS_COLOR[detailItem.status] ?? 'default'}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Target ID: {detailItem.targetId}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reason: {detailItem.reason}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Score: {detailItem.score.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Created: {new Date(detailItem.createdAt).toLocaleString()}
              </Typography>
              {detailItem.reviewerDecision && (
                <Typography variant="body2" color="text.secondary">
                  Previous decision: {detailItem.reviewerDecision}
                </Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailItem(null)}>Close</Button>
            {detailItem.status === 'pending' && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ id: detailItem.id, decision: 'approve' })}
                >
                  Approve
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ id: detailItem.id, decision: 'remove' })}
                >
                  Remove
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      )}

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

export function ModerationQueuePage() {
  return (
    <AdminWorkspace>
      <ModerationQueuePageContent />
    </AdminWorkspace>
  );
}
