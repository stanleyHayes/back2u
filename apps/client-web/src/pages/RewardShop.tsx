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
  Tooltip,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { RedemptionDTO, RewardOfferListingDTO } from '@back2u/shared-types';
import { REWARD_CATEGORY_LABELS, TRUST_LEVEL_LABELS } from '@back2u/shared-types';
import RedeemOutlinedIcon from '@mui/icons-material/RedeemOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';
import { PageHeader, SectionCard } from '../components/BrandPage.js';

const TEAL = '#40614A';
const MARIGOLD = '#8B6F4E';

/** Stock left, phrased the way a shopper reads it. */
function stockLabel(offer: RewardOfferListingDTO): string | null {
  if (offer.remainingInventory === null) return null;
  if (offer.remainingInventory === 0) return 'All claimed';
  if (offer.remainingInventory <= 5) return `Only ${offer.remainingInventory} left`;
  return `${offer.remainingInventory} left`;
}

function endsLabel(offer: RewardOfferListingDTO): string | null {
  if (!offer.endsAt) return null;
  const days = Math.ceil((new Date(offer.endsAt).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return 'Ending today';
  if (days === 1) return 'Ends tomorrow';
  if (days <= 14) return `Ends in ${days} days`;
  return null;
}

export function RewardShopPage() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const balance = user?.pointsBalance ?? 0;

  const [confirming, setConfirming] = useState<RewardOfferListingDTO | null>(null);
  const [claimed, setClaimed] = useState<RedemptionDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['reward-catalog'],
    queryFn: () => api.listRewardCatalog({ pageSize: 48 }),
  });

  const reserve = useMutation({
    mutationFn: (offerId: string) => api.reserveReward(offerId),
    onSuccess: async (redemption) => {
      setConfirming(null);
      setClaimed(redemption);
      void qc.invalidateQueries({ queryKey: ['reward-catalog'] });
      void qc.invalidateQueries({ queryKey: ['my-redemptions'] });
      // The points were spent server-side; refresh so the balance is current.
      try {
        setUser(await api.me());
      } catch {
        /* the catalogue refetch will correct it on the next load */
      }
    },
    onError: (err: Error) => {
      setConfirming(null);
      setError(err.message);
    },
  });

  const offers = data?.offers ?? [];

  return (
    <Box sx={{ maxWidth: 1080, mx: 'auto' }}>
      <PageHeader
        eyebrow="Rewards"
        title="Reward shop"
        subtitle={
          <>
            Perks from our partners, paid for with the BakPoints you earned returning things to
            their owners. You have <b>{balance.toLocaleString()} points</b>.
          </>
        }
      />

      {isLoading ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: 2.5,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={210} />
          ))}
        </Box>
      ) : isError ? (
        <SectionCard icon={<RedeemOutlinedIcon />} title="Could not load the shop">
          <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              The reward shop is temporarily unavailable.
            </Typography>
            <Button variant="outlined" onClick={() => void refetch()}>
              Try again
            </Button>
          </Stack>
        </SectionCard>
      ) : offers.length === 0 ? (
        <SectionCard icon={<RedeemOutlinedIcon />} title="Nothing here yet">
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Our partners are still putting their rewards together. Keep returning items — your
            points do not expire, and they will be waiting when the first perks land.
          </Typography>
        </SectionCard>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
            gap: 2.5,
          }}
        >
          {offers.map((offer) => {
            const stock = stockLabel(offer);
            const ends = endsLabel(offer);
            const affordable = balance >= offer.pointsCost;

            return (
              <SectionCard key={offer.id} accent={offer.eligible ? TEAL : MARIGOLD}>
                <Stack spacing={1.5} sx={{ height: '100%' }}>
                  {offer.imageUrl ? (
                    <Box
                      component="img"
                      src={offer.imageUrl}
                      alt=""
                      sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 2 }}
                    />
                  ) : null}

                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
                    <Chip size="small" label={REWARD_CATEGORY_LABELS[offer.category]} />
                    {offer.minTrustLevel ? (
                      <Tooltip title="Earned by returning things to their owners">
                        <Chip
                          size="small"
                          variant="outlined"
                          icon={<LockOutlinedIcon />}
                          label={TRUST_LEVEL_LABELS[offer.minTrustLevel]}
                        />
                      </Tooltip>
                    ) : null}
                    {stock ? <Chip size="small" variant="outlined" label={stock} /> : null}
                    {ends ? <Chip size="small" color="warning" label={ends} /> : null}
                  </Stack>

                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{offer.title}</Typography>
                    {offer.institutionName ? (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        by {offer.institutionName}
                      </Typography>
                    ) : null}
                  </Box>

                  <Typography variant="body2" sx={{ color: 'text.secondary', flexGrow: 1 }}>
                    {offer.description}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Typography sx={{ fontWeight: 700, color: MARIGOLD }}>
                      {offer.pointsCost.toLocaleString()} pts
                    </Typography>
                    <Button
                      size="small"
                      variant="contained"
                      disabled={!offer.eligible || reserve.isPending}
                      onClick={() => setConfirming(offer)}
                    >
                      Claim
                    </Button>
                  </Stack>

                  {!offer.eligible && offer.ineligibleReason ? (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {offer.ineligibleReason}
                      {!affordable && user
                        ? ` You need ${(offer.pointsCost - balance).toLocaleString()} more.`
                        : ''}
                    </Typography>
                  ) : null}
                </Stack>
              </SectionCard>
            );
          })}
        </Box>
      )}

      {/* Claiming spends points immediately, so it is worth one confirmation. */}
      <Dialog
        open={confirming !== null}
        onClose={() => setConfirming(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Claim this reward?</DialogTitle>
        <DialogContent dividers>
          {confirming ? (
            <Stack spacing={1.5}>
              <Typography sx={{ fontWeight: 700 }}>{confirming.title}</Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {confirming.description}
              </Typography>
              <Alert severity="info">
                {confirming.pointsCost.toLocaleString()} points come out of your balance now, and
                you have {confirming.reservationHours} hours to collect it from{' '}
                {confirming.institutionName ?? 'the partner'}. If you do not, the points come back.
              </Alert>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirming(null)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={reserve.isPending}
            onClick={() => confirming && reserve.mutate(confirming.id)}
          >
            {reserve.isPending ? 'Claiming…' : 'Claim it'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={claimed !== null} onClose={() => setClaimed(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Show this code to collect</DialogTitle>
        <DialogContent dividers>
          {claimed ? (
            <Stack spacing={2} sx={{ alignItems: 'center', py: 1 }}>
              <Typography
                sx={{ fontFamily: 'monospace', fontSize: 34, letterSpacing: 6, fontWeight: 700 }}
              >
                {claimed.code}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
                {claimed.offerTitle} · {claimed.institutionName}
              </Typography>
              {claimed.expiresAt ? (
                <Alert severity="warning" sx={{ width: '100%' }}>
                  Collect it before {new Date(claimed.expiresAt).toLocaleString()}. After that the
                  reward goes back on sale and your points are returned.
                </Alert>
              ) : null}
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                You can find this code again under Redeem points.
              </Typography>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setClaimed(null)}>
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={error !== null} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
    </Box>
  );
}
