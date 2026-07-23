import { Alert, Box, Button, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { InstitutionDTO, RedemptionStatus } from '@back2u/shared-types';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';
import { PageHeader, SectionCard } from '../components/BrandPage.js';

const INK = '#0B3D38';
const MARIGOLD = '#E0A106';

const STATUS_COLOR: Record<RedemptionStatus, 'default' | 'warning' | 'success' | 'error'> = {
  pending: 'warning',
  fulfilled: 'success',
  cancelled: 'error',
};

const money = (minor: number, currency: string) => `${(minor / 100).toFixed(2)} ${currency}`;

export function RedeemPage() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const [institutionId, setInstitutionId] = useState('');
  const [points, setPoints] = useState(100);

  const { data: institutions } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => api.listInstitutions(),
  });
  const redeemable: InstitutionDTO[] = (institutions ?? []).filter((i) => i.pointsRedeemable);

  const { data: mine } = useQuery({
    queryKey: ['my-redemptions'],
    queryFn: () => api.listMyRedemptions(),
  });

  const selected = redeemable.find((i) => i.id === institutionId);
  const rate = selected?.pointToCurrencyRate ?? 1;
  const estValue = Math.round(points * rate);
  const balance = user?.pointsBalance ?? 0;

  const create = useMutation({
    mutationFn: () => api.createRedemption({ institutionId, points }),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ['my-redemptions'] });
      // points were held server-side — refresh the user so the balance is current
      try {
        setUser(await api.me());
      } catch {
        /* ignore */
      }
    },
  });

  return (
    <Box sx={{ maxWidth: 760, mx: 'auto' }}>
      <PageHeader
        eyebrow="Rewards"
        title="Redeem your points"
        subtitle={
          <>
            Spend the points you&apos;ve earned returning items at our partner establishments. You
            have <b>{balance.toLocaleString()} points</b>.
          </>
        }
      />

      <Stack spacing={2.5}>
        <SectionCard
          icon={<RedeemOutlinedIcon />}
          title="Create a voucher"
          desc="Generate a code to show at a partner counter."
          accent={MARIGOLD}
        >
          {redeemable.length === 0 ? (
            <Alert severity="info">
              No partner institutions are accepting points yet. Check back soon.
            </Alert>
          ) : (
            <Stack spacing={2.5}>
              <TextField
                select
                label="Where do you want to redeem?"
                value={institutionId}
                onChange={(e) => setInstitutionId(e.target.value)}
                fullWidth
              >
                <MenuItem value="">
                  <em>Select a partner institution</em>
                </MenuItem>
                {redeemable.map((i) => (
                  <MenuItem key={i.id} value={i.id}>
                    {i.name}
                    {i.pointToCurrencyRate ? ` — ${i.pointToCurrencyRate}¢/pt` : ''}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Points to redeem"
                type="number"
                value={points}
                onChange={(e) => setPoints(Math.max(0, Math.floor(Number(e.target.value))))}
                fullWidth
                slotProps={{ htmlInput: { min: 1, max: balance } }}
                helperText={points > balance ? 'You don’t have enough points.' : ' '}
                error={points > balance}
              />

              {selected && points > 0 && points <= balance && (
                <Alert severity="success" sx={{ alignItems: 'center' }}>
                  {points} points ≈ <b>&nbsp;{money(estValue, 'GHS')}</b>&nbsp; at {selected.name}.
                </Alert>
              )}

              {create.isError && (
                <Alert severity="error">
                  {create.error instanceof Error
                    ? create.error.message
                    : 'Could not create voucher'}
                </Alert>
              )}

              {create.isSuccess && create.data && (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: '20px 20px 20px 6px',
                    bgcolor: INK,
                    color: '#FBF6EC',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: 13,
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      opacity: 0.7,
                    }}
                  >
                    Show this code at the counter
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: '"Fraunces", serif',
                      fontWeight: 600,
                      fontSize: 44,
                      letterSpacing: '0.08em',
                      my: 1,
                    }}
                  >
                    {create.data.code}
                  </Typography>
                  <Typography sx={{ opacity: 0.85 }}>
                    {create.data.points} points ={' '}
                    <b>{money(create.data.value, create.data.currency)}</b>
                  </Typography>
                </Box>
              )}

              <Box>
                <Button
                  size="large"
                  onClick={() => create.mutate()}
                  disabled={!institutionId || points <= 0 || points > balance || create.isPending}
                  sx={{
                    bgcolor: MARIGOLD,
                    color: INK,
                    borderRadius: 999,
                    fontWeight: 700,
                    px: 3,
                    py: 1.3,
                    '&:hover': { bgcolor: '#cf9305' },
                  }}
                >
                  {create.isPending ? 'Creating…' : 'Generate voucher'}
                </Button>
              </Box>
            </Stack>
          )}
        </SectionCard>

        <SectionCard icon={<ConfirmationNumberOutlinedIcon />} title="Your vouchers">
          {(mine ?? []).length === 0 ? (
            <Typography color="text.secondary">No vouchers yet.</Typography>
          ) : (
            <Stack spacing={1}>
              {(mine ?? []).map((r) => (
                <Box
                  key={r.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: INK }}>
                      {r.code} · {r.points} pts = {money(r.value, r.currency)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.institutionName ?? 'Institution'} ·{' '}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Chip
                    label={r.status}
                    size="small"
                    color={STATUS_COLOR[r.status]}
                    sx={{ textTransform: 'capitalize', flexShrink: 0 }}
                  />
                </Box>
              ))}
            </Stack>
          )}
        </SectionCard>
      </Stack>
    </Box>
  );
}
