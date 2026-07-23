import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_CURRENCY } from '@back2u/shared-types';
import { useState } from 'react';

import { api } from '../lib/api.js';

export function MarketplaceCreatePage() {
  const qc = useQueryClient();
  const { data: live } = useQuery({ queryKey: ['mp-live'], queryFn: () => api.listMarketplace() });
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
      setForm({ itemId: '', startingPrice: '', buyNowPrice: '', daysOpen: '7', charityRecipient: '' });
      qc.invalidateQueries({ queryKey: ['mp-live'] });
    },
  });

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={700}>Marketplace</Typography>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>List an unclaimed item</Typography>
          {create.isError && <Alert severity="error">{(create.error as Error).message}</Alert>}
          {create.isSuccess && <Alert severity="success">Listing live: {create.data.id}</Alert>}
          <Stack spacing={2} mt={2}>
            <TextField label="Item ID" value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} />
            <Stack direction="row" spacing={2}>
              <TextField label={`Starting price (${DEFAULT_CURRENCY})`} type="number" value={form.startingPrice} onChange={(e) => setForm({ ...form, startingPrice: e.target.value })} sx={{ flex: 1 }} />
              <TextField label={`Buy-now (${DEFAULT_CURRENCY}, optional)`} type="number" value={form.buyNowPrice} onChange={(e) => setForm({ ...form, buyNowPrice: e.target.value })} sx={{ flex: 1 }} />
              <TextField label="Days open" type="number" value={form.daysOpen} onChange={(e) => setForm({ ...form, daysOpen: e.target.value })} sx={{ flex: 1 }} />
            </Stack>
            <TextField label="Charity recipient (optional)" value={form.charityRecipient} onChange={(e) => setForm({ ...form, charityRecipient: e.target.value })} />
            <Button variant="contained" onClick={() => create.mutate()} disabled={!form.itemId || !form.startingPrice || create.isPending}>
              List
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Typography variant="h6">Currently live</Typography>
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)' }} gap={2}>
        {(live ?? []).map((l) => (
          <Card key={l.id} variant="outlined">
            <CardContent>
              <Typography variant="subtitle2">Listing {l.id.slice(-6)}</Typography>
              <Typography variant="body2" color="text.secondary">
                Item {l.itemId.slice(-6)} · starts at {(l.startingPrice / 100).toFixed(2)} {l.currency}
              </Typography>
              <Typography variant="caption">closes {new Date(l.closesAt).toLocaleString()}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}
