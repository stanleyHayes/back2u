import { Alert, Box, Button, Chip, Stack, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SubscriptionTier } from '@back2u/shared-types';
import { EmptyState, PageHeader } from '@back2u/ui-web';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

const INK = '#2E3D2F';
const PAPER = '#F2EFEA';
const TEAL = '#40614A';
const MARIGOLD = '#8B6F4E';

const ORDER: Record<SubscriptionTier, number> = { free: 0, pro: 1, enterprise: 2 };
const money = (minor: number, currency: string) =>
  minor === 0 ? 'Free' : `${currency} ${(minor / 100).toLocaleString()}/mo`;

export function BillingPage() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const institutionId = user?.institutionId;

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.getSubscriptionPlans(),
  });
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
    <Box sx={{ maxWidth: 1040, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <PageHeader
          icon={<CreditCardOutlinedIcon />}
          title="Plans & billing"
          description="Upgrade your institution to unlock unlimited items, courier dispatch, analytics, and API access."
        />
      </Box>

      {!institutionId && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          Your account isn&apos;t linked to an institution yet, so plans can&apos;t be changed here.
        </Alert>
      )}

      {inst && (
        <Box
          sx={{
            mb: 3,
            p: 2.5,
            borderRadius: 2,
            bgcolor: INK,
            color: PAPER,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontSize: 12,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(250,248,243,0.6)',
              }}
            >
              {inst.name}
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Black Ops One", Georgia, serif',
                fontSize: 22,
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {plans?.find((p) => p.tier === current)?.name ?? current} plan
            </Typography>
          </Box>
          {current !== 'free' && inst.subscriptionRenewsAt && (
            <Typography sx={{ color: 'rgba(250,248,243,0.7)', fontSize: 14 }}>
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

      {plans && plans.length === 0 && (
        <EmptyState
          tone="marigold"
          icon={<CreditCardOutlinedIcon />}
          title="No plans available"
          description="Subscription plans couldn't be found right now. Check back in a moment."
        />
      )}

      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}
      >
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
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: '2px solid',
                borderColor: isCurrent ? TEAL : featured ? MARIGOLD : 'divider',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: featured ? '0 30px 60px -40px rgba(139,111,78,0.5)' : 'none',
              }}
            >
              {featured && !isCurrent && (
                <Chip
                  label="Most popular"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -12,
                    right: 16,
                    bgcolor: MARIGOLD,
                    color: INK,
                    fontWeight: 700,
                  }}
                />
              )}
              {isCurrent && (
                <Chip
                  label="Current"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -12,
                    right: 16,
                    bgcolor: TEAL,
                    color: '#fff',
                    fontWeight: 700,
                  }}
                />
              )}
              <Typography sx={{ fontWeight: 700, fontSize: 18, color: 'text.primary' }}>
                {plan.name}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Black Ops One", Georgia, serif',
                  fontWeight: 600,
                  fontSize: 30,
                  color: 'text.primary',
                  mt: 0.5,
                }}
              >
                {money(plan.priceMinor, plan.currency)}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 13.5, mt: 0.5, mb: 2 }}>
                {plan.tagline}
              </Typography>
              <Stack spacing={1} sx={{ flex: 1, mb: 2.5 }}>
                {plan.features.map((f) => (
                  <Stack key={f} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                    <CheckRoundedIcon
                      sx={{ fontSize: 18, color: TEAL, mt: '2px', flexShrink: 0 }}
                    />
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
                    ? {
                        bgcolor: MARIGOLD,
                        color: INK,
                        borderRadius: 999,
                        fontWeight: 700,
                        py: 1.1,
                        '&:hover': { bgcolor: '#6F5940' },
                      }
                    : {
                        borderRadius: 999,
                        fontWeight: 700,
                        py: 1.1,
                        color: 'text.primary',
                        borderColor: 'divider',
                      }
                }
              >
                {isCurrent
                  ? 'Current plan'
                  : subscribe.isPending && subscribe.variables === plan.tier
                    ? 'Updating…'
                    : isUpgrade
                      ? 'Upgrade'
                      : 'Switch'}
              </Button>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
