import { Alert, Box, Button, Card, CardContent, Chip, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { SubscriptionTier } from '@back2u/shared-types';

import { api } from '../lib/api.js';

const TIER_COLOR: Record<SubscriptionTier, 'default' | 'primary' | 'warning'> = {
  free: 'default',
  pro: 'primary',
  enterprise: 'warning',
};

export function InstitutionsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ['admin-institutions'], queryFn: () => api.listInstitutions() });
  const [form, setForm] = useState({
    name: '',
    type: 'school' as const,
    contactEmail: '',
    placeName: '',
    lng: '0',
    lat: '0',
  });
  const [apiKey, setApiKey] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      api.onboardInstitution({
        name: form.name,
        type: form.type,
        contactEmail: form.contactEmail,
        place: { name: form.placeName, lng: Number(form.lng), lat: Number(form.lat) },
      }),
    onSuccess: (res) => {
      setApiKey(res.apiKey);
      qc.invalidateQueries({ queryKey: ['admin-institutions'] });
    },
  });

  const setPlan = useMutation({
    mutationFn: ({ id, tier }: { id: string; tier: SubscriptionTier }) => api.subscribeInstitution(id, tier),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-institutions'] }),
  });

  return (
    <Stack spacing={3}>
      <Typography variant="h4" fontWeight={700}>
        Institutions
      </Typography>
      {apiKey && <Alert severity="success">API key (copy now, won't show again): {apiKey}</Alert>}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">Onboard institution</Typography>
          <Stack spacing={2} mt={2}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextField label="Contact email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            <TextField label="Place name" value={form.placeName} onChange={(e) => setForm({ ...form, placeName: e.target.value })} />
            <Stack direction="row" spacing={1}>
              <TextField label="Lng" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
              <TextField label="Lat" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
            </Stack>
            <Button variant="contained" onClick={() => create.mutate()} disabled={!form.name || create.isPending}>
              Onboard
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2,1fr)' }} gap={2}>
        {data?.map((i) => (
          <Card key={i.id} variant="outlined">
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="h6" noWrap>{i.name}</Typography>
                <Chip
                  size="small"
                  label={i.subscriptionTier ?? 'free'}
                  color={TIER_COLOR[i.subscriptionTier ?? 'free']}
                  sx={{ textTransform: 'capitalize', fontWeight: 700, flexShrink: 0 }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {i.type} · {i.place.name}
              </Typography>
              <TextField
                select
                size="small"
                label="Plan"
                value={i.subscriptionTier ?? 'free'}
                onChange={(e) => setPlan.mutate({ id: i.id, tier: e.target.value as SubscriptionTier })}
                disabled={setPlan.isPending}
                sx={{ mt: 2, minWidth: 160 }}
              >
                <MenuItem value="free">Starter (free)</MenuItem>
                <MenuItem value="pro">Pro</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
              </TextField>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Stack>
  );
}
