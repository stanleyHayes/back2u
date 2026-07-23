import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { UserDTO } from '@back2u/shared-types';

import { api } from '../lib/api.js';

const STATUS_COLOR: Record<string, 'success' | 'error' | 'warning' | 'default'> = {
  active: 'success',
  banned: 'error',
  suspended: 'warning',
};

const ROLE_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'error'> = {
  user: 'default',
  finder: 'primary',
  trusted_finder: 'secondary',
  courier: 'info',
  partner_admin: 'success',
  admin: 'error',
  super_admin: 'error',
};

export function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, rowsPerPage, search],
    queryFn: () =>
      api.listUsers({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        search: search || undefined,
      }),
  });

  const updateStatus = useMutation({
    mutationFn: (input: { id: string; status: string; reason?: string }) =>
      api.updateUserStatus(input.id, input.status, input.reason),
  });

  const updateRoles = useMutation({
    mutationFn: (input: { id: string; roles: string[] }) => api.updateUserRoles(input.id, input.roles),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const [roleDialog, setRoleDialog] = useState<{ open: boolean; user: UserDTO | null }>({
    open: false,
    user: null,
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const items = data ?? [];
  const allSelected = items.length > 0 && items.every((u) => selectedIds.has(u.id));
  const someSelected = items.some((u) => selectedIds.has(u.id)) && !allSelected;

  const openRoleDialog = (user: UserDTO) => {
    setRoleDialog({ open: true, user });
    setSelectedRoles([...user.roles]);
  };

  const closeRoleDialog = () => {
    setRoleDialog({ open: false, user: null });
    setSelectedRoles([]);
  };

  const handleSaveRoles = () => {
    if (roleDialog.user) {
      updateRoles.mutate({ id: roleDialog.user.id, roles: selectedRoles });
    }
    closeRoleDialog();
  };

  const allRoles = ['user', 'finder', 'trusted_finder', 'courier', 'partner_admin', 'admin', 'super_admin'];

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((u) => u.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const runBulk = async (status: 'banned' | 'active') => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setProcessing(true);
    setProgress({ current: 0, total: ids.length });
    let failed = 0;

    for (let i = 0; i < ids.length; i++) {
      setProgress({ current: i + 1, total: ids.length });
      try {
        await updateStatus.mutateAsync({ id: ids[i], status, reason: 'Bulk update' } as { id: string; status: string; reason: string });
      } catch {
        failed++;
      }
    }

    setSelectedIds(new Set());
    setProcessing(false);
    await qc.invalidateQueries({ queryKey: ['admin-users'] });
    setSnackbar({
      open: true,
      message: failed > 0 ? `Completed with ${failed} failures.` : `All ${ids.length} users updated to ${status}.`,
      severity: failed > 0 ? 'error' : 'success',
    });
  };

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={700}>
        User Management
      </Typography>

      <TextField
        label="Search by name or email"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        size="small"
        sx={{ maxWidth: 400 }}
      />

      {updateStatus.isError && (
        <Alert severity="error">Failed to update user status.</Alert>
      )}
      {updateRoles.isError && (
        <Alert severity="error">Failed to update user roles.</Alert>
      )}

      {selectedIds.size > 0 && (
        <Stack direction="row" spacing={1}>
          <Button variant="contained" color="error" disabled={processing} onClick={() => runBulk('banned')}>
            Ban selected ({selectedIds.size})
          </Button>
          <Button variant="outlined" color="success" disabled={processing} onClick={() => runBulk('active')}>
            Activate selected ({selectedIds.size})
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

      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleSelectAll} disabled={items.length === 0 || processing} />
              </TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Roles</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Points</TableCell>
              <TableCell>Reputation</TableCell>
              <TableCell>Joined</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton variant="text" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {items.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedIds.has(user.id)}
                    onChange={() => toggleSelect(user.id)}
                    disabled={processing}
                  />
                </TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                    {user.roles.map((r) => (
                      <Chip key={r} label={r} size="small" color={ROLE_COLORS[r] ?? 'default'} />
                    ))}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.status ?? 'active'}
                    size="small"
                    color={STATUS_COLOR[user.status ?? 'active'] ?? 'default'}
                  />
                </TableCell>
                <TableCell>{user.pointsBalance}</TableCell>
                <TableCell>{user.reputationScore}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    {user.status !== 'banned' && (
                      <Button
                        size="small"
                        color="error"
                        onClick={() => updateStatus.mutate({ id: user.id, status: 'banned' })}
                        disabled={updateStatus.isPending || processing}
                      >
                        Ban
                      </Button>
                    )}
                    {user.status !== 'suspended' && (
                      <Button
                        size="small"
                        color="warning"
                        onClick={() => updateStatus.mutate({ id: user.id, status: 'suspended' })}
                        disabled={updateStatus.isPending || processing}
                      >
                        Suspend
                      </Button>
                    )}
                    {user.status !== 'active' && (
                      <Button
                        size="small"
                        color="success"
                        onClick={() => updateStatus.mutate({ id: user.id, status: 'active' })}
                        disabled={updateStatus.isPending || processing}
                      >
                        Activate
                      </Button>
                    )}
                    <Button size="small" onClick={() => openRoleDialog(user)} disabled={updateRoles.isPending || processing}>
                      Edit roles
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <TablePagination
        component="div"
        count={-1}
        page={page}
        onPageChange={(_e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      <Dialog open={roleDialog.open} onClose={closeRoleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit roles — {roleDialog.user?.name}</DialogTitle>
        <DialogContent>
          <Select
            multiple
            fullWidth
            value={selectedRoles}
            onChange={(e) => setSelectedRoles(e.target.value as string[])}
            renderValue={(selected) => (
              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                {(selected as string[]).map((r) => (
                  <Chip key={r} label={r} size="small" />
                ))}
              </Stack>
            )}
          >
            {allRoles.map((role) => (
              <MenuItem key={role} value={role}>
                {role}
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRoleDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveRoles}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

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
