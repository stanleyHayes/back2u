import {
  AdminWorkspace,
  WorkspaceHeader as PageHeader,
  QueueSummary,
  workspacePanel,
} from '../components/AdminWorkspace.js';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_CURRENCY } from '@back2u/shared-types';
import { useState } from 'react';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import { EmptyState, ListSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';

const TEAL = '#A8B5A0';
const MARIGOLD = '#8B6F4E';

function closesIn(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'closed';
  const days = Math.floor(ms / 86_400_000);
  if (days >= 1) return `${days}d left`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours}h left`;
  return `${Math.max(1, Math.floor(ms / 60_000))}m left`;
}

function MarketplaceCreatePageContent() {
  const qc = useQueryClient();
  const {
    data: live,
    isLoading,
    isError,
    refetch,
  } = useQuery({ queryKey: ['mp-live'], queryFn: () => api.listMarketplace() });
  const [form, setForm] = useState({
    itemId: '',
    startingPrice: '',
    buyNowPrice: '',
    daysOpen: '7',
    charityRecipient: '',
  });

  const create = useMutation({
    mutationFn: () =>
      api.createListing({
        itemId: form.itemId,
        startingPrice: Math.round(Number(form.startingPrice) * 100), // pesewa
        buyNowPrice: form.buyNowPrice ? Math.round(Number(form.buyNowPrice) * 100) : undefined,
        daysOpen: Number(form.daysOpen),
        charityRecipient: form.charityRecipient || undefined,
      }),
    onSuccess: () => {
      setForm({
        itemId: '',
        startingPrice: '',
        buyNowPrice: '',
        daysOpen: '7',
        charityRecipient: '',
      });
      qc.invalidateQueries({ queryKey: ['mp-live'] });
    },
  });

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<StorefrontOutlinedIcon />}
        title="Marketplace"
        description="List unclaimed items for timed auction and keep an eye on what's currently live."
      />
      <QueueSummary
        count={isLoading || isError ? undefined : live?.length}
        label="Live marketplace listings"
        description="Give unclaimed belongings another life through timed auctions."
      />
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            List an unclaimed item
          </Typography>
          {create.isError && <Alert severity="error">{(create.error as Error).message}</Alert>}
          {create.isSuccess && <Alert severity="success">Listing live: {create.data.id}</Alert>}
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Item ID"
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
            />
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label={`Starting price (${DEFAULT_CURRENCY})`}
                type="number"
                value={form.startingPrice}
                onChange={(e) => setForm({ ...form, startingPrice: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label={`Buy-now (${DEFAULT_CURRENCY}, optional)`}
                type="number"
                value={form.buyNowPrice}
                onChange={(e) => setForm({ ...form, buyNowPrice: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Days open"
                type="number"
                value={form.daysOpen}
                onChange={(e) => setForm({ ...form, daysOpen: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Stack>
            <TextField
              label="Charity recipient (optional)"
              value={form.charityRecipient}
              onChange={(e) => setForm({ ...form, charityRecipient: e.target.value })}
            />
            <Button
              variant="contained"
              onClick={() => create.mutate()}
              disabled={!form.itemId || !form.startingPrice || create.isPending}
            >
              Publish listing
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <Typography variant="h6">Currently live</Typography>
        {live && live.length > 0 && (
          <Chip
            size="small"
            label={live.length}
            sx={{
              bgcolor: 'rgba(168,181,160,0.14)',
              color: 'var(--workspace-green)',
              fontWeight: 700,
            }}
          />
        )}
      </Stack>
      {isLoading && <ListSkeleton rows={3} />}
      {isError && (
        <Alert severity="error" action={<Button onClick={() => void refetch()}>Retry</Button>}>
          Could not load listings.
        </Alert>
      )}
      {live && live.length === 0 && (
        <EmptyState
          dense
          tone="marigold"
          icon={<StorefrontOutlinedIcon />}
          title="No live listings"
          description="Listings you create above will appear here while they're open for bidding."
        />
      )}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)' },
          gap: 2,
        }}
      >
        {(live ?? []).map((l) => (
          <Box
            key={l.id}
            sx={{
              position: 'relative',
              ...workspacePanel,
              overflow: 'hidden',
              transition: 'border-color .15s, transform .15s',
              '&:hover': { borderColor: TEAL, transform: 'translateY(-2px)' },
              '&::before': {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 3,
                bgcolor: MARIGOLD,
              },
            }}
          >
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography
                sx={{
                  fontSize: 12,
                  letterSpacing: '0.08em',
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                }}
              >
                Listing {l.id.slice(-6)}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    bgcolor: 'var(--workspace-green)',
                    boxShadow: `0 0 0 3px rgba(168,181,160,0.2)`,
                  }}
                />
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: 'var(--workspace-green)',
                    letterSpacing: '0.08em',
                  }}
                >
                  LIVE
                </Typography>
              </Stack>
            </Stack>

            <Typography sx={{ mt: 1.25, fontSize: 12.5, color: 'text.secondary' }}>
              Item {l.itemId.slice(-6)}
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline', mt: 0.25 }}>
              <Typography
                sx={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: 26,
                  lineHeight: 1.1,
                  color: 'text.primary',
                }}
              >
                {(l.startingPrice / 100).toFixed(2)}
              </Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.secondary' }}>
                {l.currency}
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>starting bid</Typography>

            <Stack
              direction="row"
              spacing={0.75}
              sx={{
                mt: 1.75,
                pt: 1.5,
                borderTop: 1,
                borderColor: 'divider',
                alignItems: 'center',
                color: 'text.secondary',
              }}
            >
              <ScheduleOutlinedIcon sx={{ fontSize: 15 }} />
              <Typography sx={{ fontSize: 12.5 }}>
                {closesIn(l.closesAt)} · {new Date(l.closesAt).toLocaleDateString()}
              </Typography>
            </Stack>
          </Box>
        ))}
      </Box>
    </Stack>
  );
}

export function MarketplaceCreatePage() {
  return (
    <AdminWorkspace>
      <MarketplaceCreatePageContent />
    </AdminWorkspace>
  );
}
