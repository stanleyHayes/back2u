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
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import type { SubscriptionTier } from '@back2u/shared-types';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import LocalMallOutlinedIcon from '@mui/icons-material/LocalMallOutlined';
import LocalCafeOutlinedIcon from '@mui/icons-material/LocalCafeOutlined';
import RestaurantOutlinedIcon from '@mui/icons-material/RestaurantOutlined';
import LocalPharmacyOutlinedIcon from '@mui/icons-material/LocalPharmacyOutlined';
import FlightTakeoffOutlinedIcon from '@mui/icons-material/FlightTakeoffOutlined';
import DirectionsBusOutlinedIcon from '@mui/icons-material/DirectionsBusOutlined';
import type { ReactNode } from 'react';
import { EmptyState, ListSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';

const TIER_COLOR: Record<SubscriptionTier, 'default' | 'primary' | 'warning'> = {
  free: 'default',
  pro: 'primary',
  enterprise: 'warning',
};

const TYPE_ICON: Record<string, ReactNode> = {
  school: <SchoolOutlinedIcon />,
  mall: <LocalMallOutlinedIcon />,
  cafe: <LocalCafeOutlinedIcon />,
  restaurant: <RestaurantOutlinedIcon />,
  pharmacy: <LocalPharmacyOutlinedIcon />,
  airport: <FlightTakeoffOutlinedIcon />,
  transport: <DirectionsBusOutlinedIcon />,
};

const TIER_LABEL: Record<SubscriptionTier, string> = {
  free: 'Free',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

function InstitutionsPageContent() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-institutions'],
    queryFn: () => api.listInstitutions(),
  });
  const [form, setForm] = useState({
    name: '',
    type: 'school' as const,
    contactEmail: '',
    placeName: '',
    lng: '0',
    lat: '0',
  });
  const [search, setSearch] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const visibleInstitutions = (data ?? []).filter((i) =>
    `${i.name} ${i.place.name}`.toLowerCase().includes(search.toLowerCase()),
  );
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
    mutationFn: ({ id, tier }: { id: string; tier: SubscriptionTier }) =>
      api.subscribeInstitution(id, tier),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-institutions'] }),
  });

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<ApartmentOutlinedIcon />}
        title="Institutions"
        description="Onboard schools, malls and venues, and manage their subscription plans."
      />
      <QueueSummary
        count={isLoading || isError ? undefined : data?.length}
        label="Institutions in your network"
        description="Manage partner venues and their subscription plans from one place."
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Search institutions or places"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button
          variant="contained"
          onClick={() => setShowOnboarding(!showOnboarding)}
          aria-expanded={showOnboarding}
        >
          {showOnboarding ? 'Close form' : 'Add institution'}
        </Button>
      </Stack>
      {create.isError && (
        <Alert severity="error">
          Could not onboard the institution. Please check the details and try again.
        </Alert>
      )}
      {setPlan.isError && (
        <Alert severity="error">Could not update the plan. Please try again.</Alert>
      )}
      {isError && (
        <Alert severity="error" action={<Button onClick={() => void refetch()}>Retry</Button>}>
          Could not load institutions.
        </Alert>
      )}
      {isLoading && <ListSkeleton rows={3} />}
      {apiKey && <Alert severity="success">API key (copy now, won't show again): {apiKey}</Alert>}
      {showOnboarding && (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Onboard institution</Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
              <TextField
                label="Contact email"
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
              />
              <TextField
                label="Place name"
                value={form.placeName}
                onChange={(e) => setForm({ ...form, placeName: e.target.value })}
              />
              <Stack direction="row" spacing={1}>
                <TextField
                  label="Longitude"
                  value={form.lng}
                  onChange={(e) => setForm({ ...form, lng: e.target.value })}
                />
                <TextField
                  label="Latitude"
                  value={form.lat}
                  onChange={(e) => setForm({ ...form, lat: e.target.value })}
                />
              </Stack>
              <Button
                variant="contained"
                onClick={() => create.mutate()}
                disabled={!form.name || create.isPending}
              >
                Onboard
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
      {data && data.length === 0 && (
        <EmptyState
          tone="teal"
          icon={<ApartmentOutlinedIcon />}
          title="No institutions yet"
          description="Onboard the first institution with the form above and it will show up here."
        />
      )}
      {!isLoading && !isError && !!data?.length && !visibleInstitutions.length && (
        <Alert severity="info">No institutions match this search.</Alert>
      )}
      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)' }, gap: 2 }}
      >
        {visibleInstitutions.map((i) => {
          const tier = i.subscriptionTier ?? 'free';
          return (
            <Box
              key={i.id}
              sx={{
                ...workspacePanel,
                transition: 'border-color .15s',
                '&:hover': { borderColor: 'rgba(168,181,160,0.5)' },
              }}
            >
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 2,
                    flexShrink: 0,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: 'rgba(168,181,160,0.12)',
                    color: 'var(--workspace-green)',
                    '& svg': { fontSize: 24 },
                  }}
                >
                  {TYPE_ICON[i.type] ?? <ApartmentOutlinedIcon />}
                </Box>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: 16 }} noWrap>
                      {i.name}
                    </Typography>
                    <Chip
                      size="small"
                      label={TIER_LABEL[tier]}
                      color={TIER_COLOR[tier]}
                      sx={{ fontWeight: 700, flexShrink: 0 }}
                    />
                  </Stack>
                  <Typography
                    sx={{
                      fontSize: 12.5,
                      color: 'text.secondary',
                      textTransform: 'capitalize',
                      mt: 0.25,
                    }}
                    noWrap
                  >
                    {i.type} · {i.place.name}
                  </Typography>
                </Box>
              </Stack>
              <TextField
                select
                size="small"
                label="Plan"
                value={tier}
                onChange={(e) =>
                  setPlan.mutate({ id: i.id, tier: e.target.value as SubscriptionTier })
                }
                disabled={setPlan.isPending}
                fullWidth
                sx={{ mt: 2 }}
              >
                <MenuItem value="free">Starter (free)</MenuItem>
                <MenuItem value="pro">Pro</MenuItem>
                <MenuItem value="enterprise">Enterprise</MenuItem>
              </TextField>
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
}

export function InstitutionsPage() {
  return (
    <AdminWorkspace>
      <InstitutionsPageContent />
    </AdminWorkspace>
  );
}
