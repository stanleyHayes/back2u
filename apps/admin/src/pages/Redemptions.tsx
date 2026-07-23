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
import { EmptyState } from '@back2u/ui-web';

import { api } from '../lib/api.js';

const STATUS_COLOR: Record<RedemptionStatus, 'default' | 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  fulfilled: 'success',
  cancelled: 'error',
};

function money(minor: number, currency: string): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

export function RedemptionsPage() {
  const qc = useQueryClient();
  const [code, setCode] = useState('');
  const [institutionId, setInstitutionId] = useState('');
  const [lastConfirmed, setLastConfirmed] = useState<RedemptionDTO | null>(null);

  const { data: institutions } = useQuery({
    queryKey: ['admin-institutions'],
    queryFn: () => api.listInstitutions(),
  });

  const { data: redemptions } = useQuery({
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
      <Typography variant="h4" fontWeight={700}>
        Points redemptions
      </Typography>
      <Typography color="text.secondary">
        Customers spend reputation points at partner establishments. Enter the voucher code shown in
        their app to confirm and fulfil the redemption.
      </Typography>

      {/* Confirm by code */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Confirm a voucher
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
            <TextField
              label="Voucher code"
              placeholder="RDM-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
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
            sx={{ minWidth: 280, mb: 2 }}
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

          {institutionId && (redemptions ?? []).length === 0 && (
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
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Box>
                  <Typography fontWeight={700}>
                    {r.code} · {r.points} pts = {money(r.value, r.currency)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(r.createdAt).toLocaleString()}
                    {r.fulfilledAt ? ` · fulfilled ${new Date(r.fulfilledAt).toLocaleString()}` : ''}
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
