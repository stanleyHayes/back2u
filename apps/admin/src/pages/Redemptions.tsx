import {
  AdminWorkspace,
  WorkspaceHeader as PageHeader,
  QueueSummary,
} from '../components/AdminWorkspace.js';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { RedemptionDTO, RedemptionStatus } from '@back2u/shared-types';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { EmptyState, ListSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';

const STATUS_COLOR: Record<RedemptionStatus, 'default' | 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  fulfilled: 'success',
  cancelled: 'error',
  // A lapsed reservation is not a failure — the points and stock went back.
  expired: 'default',
  reversed: 'error',
};

function money(minor: number, currency: string): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

function RedemptionsPageContent() {
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [lastConfirmed, setLastConfirmed] = useState<RedemptionDTO | null>(null);

  const {
    data: institutions,
    isLoading: institutionsLoading,
    isError: institutionsError,
    refetch: reloadInstitutions,
  } = useQuery({
    queryKey: ['admin-institutions'],
    queryFn: () => api.listInstitutions(),
  });

  const {
    data: redemptions,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['admin-redemptions', institutionId],
    queryFn: () => api.listInstitutionRedemptions(institutionId),
    enabled: !!institutionId,
  });

  const confirm = useMutation({
    mutationFn: () => api.confirmRedemption(code.trim()),
    onSuccess: (r) => {
      setLastConfirmed(r);
      setCode('');
      qc.invalidateQueries({ queryKey: ['admin-redemptions'] });
    },
  });

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<ConfirmationNumberOutlinedIcon />}
        title="Points redemptions"
        description="Customers spend reputation points at partner establishments. Enter the voucher code shown in their app to confirm and fulfil the redemption."
      />

      <QueueSummary
        count={institutionId && !isLoading && !isError ? redemptions?.length : undefined}
        label="Institution redemption ledger"
        description="Confirm a customer’s voucher, or choose an institution to inspect its redemption history."
      />
      {/* Confirm by code */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Confirm a voucher
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ alignItems: 'flex-start' }}
          >
            <TextField
              label="Voucher code"
              placeholder="RDM-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              fullWidth
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              size="large"
              onClick={() => confirm.mutate()}
              disabled={code.trim().length < 4 || confirm.isPending}
            >
              {confirm.isPending ? 'Confirming…' : 'Confirm'}
            </Button>
          </Stack>
          {confirm.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {confirm.error instanceof Error ? confirm.error.message : 'Could not confirm voucher'}
            </Alert>
          )}
          {lastConfirmed && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Confirmed <b>{lastConfirmed.code}</b> — {lastConfirmed.points} pts ={' '}
              <b>{money(lastConfirmed.value, lastConfirmed.currency)}</b>
              {lastConfirmed.institutionName ? ` at ${lastConfirmed.institutionName}` : ''}.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Per-institution ledger */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Redemption ledger
          </Typography>
          <TextField
            select
            label="Institution"
            value={institutionId}
            onChange={(e) => setInstitutionId(e.target.value)}
            disabled={institutionsLoading || institutionsError}
            fullWidth
            sx={{ maxWidth: 520, mb: 2 }}
          >
            <MenuItem value="">
              <em>Select an institution</em>
            </MenuItem>
            {(institutions ?? []).map((i) => (
              <MenuItem key={i.id} value={i.id}>
                {i.name}
              </MenuItem>
            ))}
          </TextField>

          {institutionsError && (
            <Alert
              severity="error"
              action={<Button onClick={() => void reloadInstitutions()}>Retry</Button>}
            >
              Could not load institutions.
            </Alert>
          )}
          {!institutionId && (
            <Typography sx={{ color: 'text.secondary', fontSize: 14, py: 2 }}>
              Choose an institution to see its voucher activity.
            </Typography>
          )}
          {isLoading && <ListSkeleton rows={3} />}
          {isError && (
            <Alert severity="error" action={<Button onClick={() => void refetch()}>Retry</Button>}>
              Could not load the ledger.
            </Alert>
          )}
          {institutionId && !isLoading && !isError && (redemptions ?? []).length === 0 && (
            <EmptyState
              dense
              tone="marigold"
              icon={<ConfirmationNumberOutlinedIcon />}
              title="No redemptions yet"
              description="When members redeem points at this institution, the confirmed exchanges will appear here."
            />
          )}

          <Stack spacing={1}>
            {(redemptions ?? []).map((r) => (
              <Box
                key={r.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 2,
                  p: 1.5,
                  borderRadius: '16px',
                  boxShadow: 'var(--workspace-inset)',
                  flexWrap: 'wrap',
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700 }}>
                    {r.code} · {r.points} pts = {money(r.value, r.currency)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(r.createdAt).toLocaleString()}
                    {r.fulfilledAt
                      ? ` · fulfilled ${new Date(r.fulfilledAt).toLocaleString()}`
                      : ''}
                  </Typography>
                </Box>
                <Chip label={r.status} size="small" color={STATUS_COLOR[r.status]} />
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export function RedemptionsPage() {
  return (
    <AdminWorkspace>
      <RedemptionsPageContent />
    </AdminWorkspace>
  );
}
