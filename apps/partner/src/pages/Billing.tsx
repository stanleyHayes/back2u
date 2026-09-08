import {
  PartnerWorkspace,
  WorkspaceHeader as PageHeader,
  workspacePanel,
  workspaceHeading,
} from '../components/PartnerWorkspace.js';
import { Alert, Box, Button, Chip, Skeleton, Stack, Typography } from '@mui/material';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SubscriptionTier } from '@back2u/shared-types';
import { EmptyState } from '@back2u/ui-web';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

const TEAL = '#40614A';
const MARIGOLD = '#8B6F4E';

const ORDER: Record<SubscriptionTier, number> = { free: 0, pro: 1, enterprise: 2 };
const money = (minor: number, currency: string) =>
  minor === 0 ? 'Free' : `${currency} ${(minor / 100).toLocaleString()}/mo`;

function BillingContent() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const institutionId = user?.institutionId;

  const {
    data: plans,
    isPending: plansLoading,
    isError: plansError,
    refetch: reloadPlans,
  } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => api.getSubscriptionPlans(),
  });
  const {
    data: inst,
    isPending: instLoading,
    isError: instError,
    refetch: reloadInstitution,
  } = useQuery({
    queryKey: ['my-institution', institutionId],
    queryFn: () => api.getInstitution(institutionId!),
    enabled: !!institutionId,
  });

  const current: SubscriptionTier | undefined = inst
    ? (inst.subscriptionTier ?? 'free')
    : undefined;

  const subscribe = useMutation({
    mutationFn: (tier: SubscriptionTier) => api.subscribeInstitution(institutionId!, tier),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-institution', institutionId] }),
  });

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <PageHeader
          icon={<CreditCardOutlinedIcon />}
          title="Plans & billing"
          description="Review your current plan and compare the features available to your institution."
        />
      </Box>

      {!institutionId && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          Your account isn&apos;t linked to an institution yet, so plans can&apos;t be changed here.
        </Alert>
      )}

      {plansError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={<Button onClick={() => reloadPlans()}>Retry</Button>}
        >
          Plans could not be loaded.
        </Alert>
      )}
      {instError && (
        <Alert
          severity="error"
          sx={{ mb: 3 }}
          action={<Button onClick={() => reloadInstitution()}>Retry</Button>}
        >
          Your current subscription could not be loaded. Plan changes are unavailable until it
          loads.
        </Alert>
      )}
      {subscribe.isSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Your subscription has been updated.
        </Alert>
      )}
      {inst && (
        <Box
          sx={{
            mb: 3,
            ...workspacePanel,
            color: 'text.primary',
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
                color: 'text.secondary',
              }}
            >
              {inst.name}
            </Typography>
            <Typography
              sx={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: 22,
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {plans?.find((p) => p.tier === current)?.name ?? current} plan
            </Typography>
          </Box>
          {current !== 'free' && inst.subscriptionRenewsAt && (
            <Typography sx={{ color: 'text.secondary', fontSize: 14 }}>
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

      {plansLoading && (
        <Box
          aria-label="Loading plans"
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}
        >
          {[0, 1, 2].map((index) => (
            <Box key={index} sx={workspacePanel}>
              <Skeleton height={35} width="50%" />
              <Skeleton height={55} />
              <Skeleton variant="rounded" height={160} sx={{ mt: 2 }} />
            </Box>
          ))}
        </Box>
      )}
      <Typography component="h2" sx={{ ...workspaceHeading, fontSize: 23, mb: 3 }}>
        Choose the room you need to grow
      </Typography>
      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2.5 }}
      >
        {plans?.map((plan) => {
          const isCurrent = plan.tier === current;
          const isUpgrade = current !== undefined && ORDER[plan.tier] > ORDER[current];
          return (
            <Box
              key={plan.tier}
              sx={{
                position: 'relative',
                p: 3,
                borderRadius: '24px',
                bgcolor: 'background.default',
                border: '1px solid',
                borderColor: isCurrent ? 'primary.main' : 'divider',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: isCurrent ? 'var(--workspace-inset)' : 'var(--workspace-raised)',
              }}
            >
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
                  fontFamily: 'Outfit, sans-serif',
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
                      sx={{
                        fontSize: 18,
                        color: 'var(--workspace-green)',
                        mt: '2px',
                        flexShrink: 0,
                      }}
                    />
                    <Typography sx={{ fontSize: 14 }}>{f}</Typography>
                  </Stack>
                ))}
              </Stack>
              <Button
                fullWidth
                disabled={
                  isCurrent ||
                  !institutionId ||
                  instLoading ||
                  instError ||
                  !inst ||
                  subscribe.isPending
                }
                onClick={() => subscribe.mutate(plan.tier)}
                variant={isUpgrade ? 'contained' : 'outlined'}
                sx={
                  isUpgrade
                    ? {
                        bgcolor: MARIGOLD,
                        color: '#F2EFEA',
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

export function BillingPage() {
  return (
    <PartnerWorkspace>
      <BillingContent />
    </PartnerWorkspace>
  );
}
