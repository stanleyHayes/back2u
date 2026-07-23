import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SubscriptionTier } from '@back2u/shared-types';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

const INK = '#0B3D38';
const PAPER = '#FBF6EC';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';

const ORDER: Record<SubscriptionTier, number> = { free: 0, pro: 1, enterprise: 2 };
const money = (minor: number, currency: string) =>
  minor === 0 ? 'Free' : `${currency} ${(minor / 100).toLocaleString()}/mo`;

export function BillingPage() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const institutionId = user?.institutionId;

  const { data: plans } = useQuery({ queryKey: ['subscription-plans'], queryFn: () => api.getSubscriptionPlans() });
  const { data: inst } = useQuery({
    queryKey: ['my-institution', institutionId],
    queryFn: () => api.getInstitution(institutionId!),
    enabled: !!institutionId,
  });

  const current: SubscriptionTier = inst?.subscriptionTier ?? 'free';

  const subscribe = useMutation({
    mutationFn: (tier: SubscriptionTier) => api.subscribeInstitution(institutionId!, tier),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-institution', institutionId] }),
  });

  return (
    <Box maxWidth={1040} mx="auto">
      <Typography sx={{ color: TEAL, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12, mb: 0.5 }}>
        Billing
      </Typography>
      <Typography sx={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, fontSize: 30, color: INK }}>
        Plans &amp; billing
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3, maxWidth: 620 }}>
        Upgrade your institution to unlock unlimited items, courier dispatch, analytics, and API access.
      </Typography>

      {!institutionId && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          Your account isn&apos;t linked to an institution yet, so plans can&apos;t be changed here.
        </Alert>
      )}

      {inst && (
        <Box sx={{ mb: 3, p: 2.5, borderRadius: '20px 20px 20px 6px', bgcolor: INK, color: PAPER, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography sx={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,253,248,0.6)' }}>
              {inst.name}
            </Typography>
            <Typography sx={{ fontFamily: '"Fraunces", Georgia, serif', fontSize: 22, fontWeight: 600, textTransform: 'capitalize' }}>
              {plans?.find((p) => p.tier === current)?.name ?? current} plan
            </Typography>
          </Box>
          {current !== 'free' && inst.subscriptionRenewsAt && (
            <Typography sx={{ color: 'rgba(255,253,248,0.7)', fontSize: 14 }}>
              Renews {new Date(inst.subscriptionRenewsAt).toLocaleDateString()}
            </Typography>
          )}
        </Box>
      )}

      {subscribe.isError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {subscribe.error instanceof Error ? subscribe.error.message : 'Could not change plan'}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        {plans?.map((plan) => {
          const isCurrent = plan.tier === current;
          const isUpgrade = ORDER[plan.tier] > ORDER[current];
          const featured = plan.tier === 'pro';
          return (
            <Box
              key={plan.tier}
              sx={{
                position: 'relative',
                p: 3,
                borderRadius: '24px 24px 24px 8px',
                bgcolor: 'background.paper',
                border: '2px solid',
                borderColor: isCurrent ? TEAL : featured ? MARIGOLD : 'divider',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: featured ? '0 30px 60px -40px rgba(224,161,6,0.5)' : 'none',
              }}
            >
              {featured && !isCurrent && (
                <Chip label="Most popular" size="small" sx={{ position: 'absolute', top: -12, right: 16, bgcolor: MARIGOLD, color: INK, fontWeight: 700 }} />
              )}
              {isCurrent && (
                <Chip label="Current" size="small" sx={{ position: 'absolute', top: -12, right: 16, bgcolor: TEAL, color: '#fff', fontWeight: 700 }} />
              )}
              <Typography sx={{ fontWeight: 700, fontSize: 18, color: INK }}>{plan.name}</Typography>
              <Typography sx={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, fontSize: 30, color: INK, mt: 0.5 }}>
                {money(plan.priceMinor, plan.currency)}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 13.5, mt: 0.5, mb: 2 }}>
                {plan.tagline}
              </Typography>
              <Stack spacing={1} sx={{ flex: 1, mb: 2.5 }}>
                {plan.features.map((f) => (
                  <Stack key={f} direction="row" spacing={1} alignItems="flex-start">
                    <CheckRoundedIcon sx={{ fontSize: 18, color: TEAL, mt: '2px', flexShrink: 0 }} />
                    <Typography sx={{ fontSize: 14 }}>{f}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Button
                fullWidth
                disabled={isCurrent || !institutionId || subscribe.isPending}
                onClick={() => subscribe.mutate(plan.tier)}
                variant={isUpgrade ? 'contained' : 'outlined'}
                sx={
                  isUpgrade
                    ? { bgcolor: MARIGOLD, color: INK, borderRadius: 999, fontWeight: 700, py: 1.1, '&:hover': { bgcolor: '#cf9305' } }
                    : { borderRadius: 999, fontWeight: 700, py: 1.1, color: INK, borderColor: 'divider' }
                }
              >
                {isCurrent ? 'Current plan' : subscribe.isPending && subscribe.variables === plan.tier ? 'Updating…' : isUpgrade ? 'Upgrade' : 'Switch'}
              </Button>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
