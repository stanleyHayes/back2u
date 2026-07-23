import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GavelIcon from '@mui/icons-material/Gavel';
import type { BidDTO, MarketplaceListingDTO } from '@back2u/shared-types';
import { EmptyState, CardGridSkeleton } from '@back2u/ui-web';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';
import { isFlagEnabled } from '../lib/feature-flags.js';

const DISPLAY = '"Fraunces", Georgia, serif';
const INK = '#0B3D38';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';

const money = (n: number, c: string) => `${n.toLocaleString()} ${c}`;

function closesLabel(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Closed';
  const days = Math.ceil(ms / 86_400_000);
  return days <= 1 ? 'Closes today' : `Closes in ${days} days`;
}

const STATUS_COLOR: Record<string, 'success' | 'default' | 'warning' | 'error'> = {
  live: 'success',
  pending: 'warning',
  sold: 'default',
  donated: 'success',
  withdrawn: 'error',
  cancelled: 'error',
};

export function MarketplacePage() {
  const qc = useQueryClient();
  const user = useAuth((s) => s.user);
  const featureFlags = useAuth((s) => s.featureFlags);
  // Marketplace is live by default. It only hides if an admin has explicitly
  // created the 'marketplace' flag and switched it off / scoped its rollout.
  const marketplaceFlag = featureFlags.find((f) => f.key === 'marketplace');
  const marketplaceEnabled = marketplaceFlag ? isFlagEnabled(featureFlags, 'marketplace', user?.id) : true;
  const { data } = useQuery({
    queryKey: ['marketplace'],
    queryFn: () => api.listMarketplace(),
    enabled: marketplaceEnabled,
  });
  const [bidByListing, setBidByListing] = useState<Record<string, string>>({});

  const placeBid = useMutation({
    mutationFn: (input: { listingId: string; amount: number }) => api.placeBid(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketplace'] }),
  });

  if (!marketplaceEnabled) {
    return (
      <Box sx={{ maxWidth: 1100, mx: 'auto', textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ fontWeight: 600, color: INK }}>
          Coming soon
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          The marketplace is not available right now.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ color: TEAL, mb: 1 }}>
        <GavelIcon fontSize="small" />
        <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          Unclaimed marketplace
        </Typography>
      </Stack>
      <Typography sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: { xs: 34, md: 44 }, color: INK, letterSpacing: '-0.02em' }}>
        Auctions &amp; donations
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        Items unclaimed for 60+ days move here. Net proceeds fund our finder-rewards program.
      </Typography>

      <MyBidsSection />

      {placeBid.isError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {placeBid.error instanceof Error ? placeBid.error.message : 'Bid failed'}
        </Alert>
      )}

      {!data && <CardGridSkeleton count={6} minWidth={280} />}

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)' }} gap={2.5}>
        {data?.map((l) => (
          <ListingCard
            key={l.id}
            l={l}
            bid={bidByListing[l.id] ?? ''}
            onBidChange={(v) => setBidByListing({ ...bidByListing, [l.id]: v })}
            onBid={() => {
              const amount = Number(bidByListing[l.id]);
              if (amount > 0) placeBid.mutate({ listingId: l.id, amount });
            }}
            pending={placeBid.isPending}
          />
        ))}
      </Box>

      {data && data.length === 0 && (
        <EmptyState
          tone="marigold"
          icon={<GavelIcon />}
          title="Nothing up for auction yet"
          description="Unclaimed found items and charity lots will appear here the moment they go live."
        />
      )}
    </Box>
  );
}

function ListingCard({
  l,
  bid,
  onBidChange,
  onBid,
  pending,
}: {
  l: MarketplaceListingDTO;
  bid: string;
  onBidChange: (v: string) => void;
  onBid: () => void;
  pending: boolean;
}) {
  const live = l.status === 'live';
  const item = l.item;
  const isFound = item?.kind !== 'lost';
  const title = item?.title ?? `Lot ${l.id.slice(-6)}`;
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        p: 1.25,
        borderRadius: '24px 24px 24px 8px',
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        transition: 'transform .18s, box-shadow .18s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 26px 46px -30px rgba(11,61,56,.5)' },
      }}
    >
      {/* Item image */}
      <Box
        component={Link}
        to={`/items/${l.itemId}`}
        sx={{
          position: 'relative',
          display: 'block',
          height: 172,
          borderRadius: '18px 18px 18px 4px',
          overflow: 'hidden',
          textDecoration: 'none',
          bgcolor: isFound ? 'rgba(15,118,110,0.08)' : 'rgba(194,65,12,0.08)',
        }}
      >
        {item?.imageUrl ? (
          <Box component="img" src={item.imageUrl} alt={title} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', color: TEAL }}>
            <GavelIcon sx={{ fontSize: 40, opacity: 0.5 }} />
          </Box>
        )}
        {/* status chip */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            px: 1.1,
            py: 0.35,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'capitalize',
            color: '#FFFDF8',
            bgcolor: live ? TEAL : 'rgba(11,61,56,0.75)',
          }}
        >
          {l.status}
        </Box>
        {/* closes countdown */}
        <Box
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            px: 1,
            py: 0.3,
            borderRadius: 999,
            fontSize: 11.5,
            fontWeight: 700,
            color: INK,
            bgcolor: 'rgba(251,246,236,0.92)',
            backdropFilter: 'blur(4px)',
          }}
        >
          {closesLabel(l.closesAt)}
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ px: 0.75, pt: 1.5 }}>
        {item?.category && (
          <Box
            component="span"
            sx={{ display: 'inline-block', px: 1.1, py: 0.25, borderRadius: 999, fontSize: 11, fontWeight: 600, color: 'text.secondary', border: '1px solid', borderColor: 'divider' }}
          >
            {item.category}
          </Box>
        )}
        <Typography
          component={Link}
          to={`/items/${l.itemId}`}
          noWrap
          sx={{ display: 'block', mt: 0.75, fontFamily: DISPLAY, fontWeight: 600, fontSize: 19, color: INK, textDecoration: 'none', '&:hover': { color: TEAL } }}
        >
          {title}
        </Typography>
        {item?.placeName && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {item.placeName}
          </Typography>
        )}

        <Box sx={{ mt: 1.25 }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Starting price
          </Typography>
          <Typography sx={{ fontFamily: DISPLAY, fontWeight: 600, fontSize: 24, color: INK, lineHeight: 1.1 }}>
            {money(l.startingPrice, l.currency)}
          </Typography>
          {l.buyNowPrice ? (
            <Typography variant="body2" color="text.secondary">
              Buy now: {money(l.buyNowPrice, l.currency)}
            </Typography>
          ) : null}
          {l.charityRecipient && (
            <Chip size="small" label={`Proceeds → ${l.charityRecipient}`} sx={{ mt: 0.75, bgcolor: 'rgba(15,118,110,0.1)', color: TEAL }} />
          )}
        </Box>
      </Box>

      <Box flex={1} sx={{ minHeight: 12 }} />

      <Stack direction="row" spacing={1} sx={{ px: 0.5, pb: 0.25 }}>
        <TextField
          size="small"
          type="number"
          placeholder="Your bid"
          value={bid}
          onChange={(e) => onBidChange(e.target.value)}
          disabled={!live}
          sx={{ flex: 1 }}
        />
        <Button
          onClick={onBid}
          disabled={!live || pending || !(Number(bid) > 0)}
          sx={{ bgcolor: MARIGOLD, color: INK, borderRadius: 999, fontWeight: 700, px: 2.5, '&:hover': { bgcolor: '#cf9305' } }}
        >
          Bid
        </Button>
      </Stack>
    </Box>
  );
}

function MyBidsSection() {
  const user = useAuth((s) => s.user);
  const [bids, setBids] = useState<BidDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .listMyBids()
      .then((data) => {
        if (!cancelled) setBids(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load bids');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) return null;

  return (
    <Box sx={{ mb: 3, p: 2.5, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography fontWeight={700}>My bids</Typography>
        <IconButton size="small" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Collapse' : 'Expand'}>
          <ExpandMoreIcon sx={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />
        </IconButton>
      </Stack>

      <Collapse in={open}>
        <Box sx={{ mt: 1.5 }}>
          {loading && (
            <Box display="flex" justifyContent="center" py={2}>
              <CircularProgress size={22} />
            </Box>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 1 }}>
              {error}
            </Alert>
          )}
          {!loading && !error && bids.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              You haven&apos;t placed any bids yet.
            </Typography>
          )}
          {!loading && !error && bids.length > 0 && (
            <Stack spacing={1}>
              {bids.map((bid) => (
                <Stack
                  key={bid.id}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ p: 1.25, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
                >
                  <Chip label={`Lot ${bid.listingId.slice(-6)}`} size="small" variant="outlined" />
                  <Typography fontWeight={700}>{bid.amount.toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(bid.createdAt).toLocaleDateString()}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}
