import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import TwoWheelerOutlinedIcon from '@mui/icons-material/TwoWheelerOutlined';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DEFAULT_CURRENCY } from '@back2u/shared-types';
import { useEffect, useState } from 'react';
import { CardGridSkeleton, EmptyState } from '@back2u/ui-web';

import { api } from '../lib/api.js';
import { PageHeader, SectionCard } from '../components/BrandPage.js';

const INK = '#0B3D38';
const TEAL = '#0F766E';

export function CourierPage() {
  const qc = useQueryClient();
  const [coords, setCoords] = useState<{ lng: number; lat: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [routeResult, setRouteResult] = useState<{
    totalDistanceKm: number;
    estimatedDurationMin: number;
    waypoints: { jobId: string; pickup: { name: string }; dropoff: { name: string } }[];
  } | null>(null);
  const [form, setForm] = useState({ itemId: '', pickup: '', dropoff: '', fee: 30 });

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lng: pos.coords.longitude, lat: pos.coords.latitude }),
      () => {
        setGeoError('Enable location to see nearby jobs sorted by distance.');
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['courier-open', coords?.lng, coords?.lat],
    queryFn: () =>
      coords
        ? api.listNearbyCourierJobs({ lng: coords.lng, lat: coords.lat, radiusMeters: 20000 })
        : api.listOpenCourierJobs(),
    enabled: true,
  });

  const request = useMutation({
    mutationFn: () =>
      api.requestCourierJob({
        itemId: form.itemId,
        pickup: { name: form.pickup, point: { type: 'Point', coordinates: [-0.187, 5.603] } },
        dropoff: { name: form.dropoff, point: { type: 'Point', coordinates: [-0.187, 5.603] } },
        fee: form.fee,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courier-open'] }),
  });

  const planRoute = useMutation({
    mutationFn: () =>
      api.calculateCourierRoute({
        jobIds: Array.from(selectedIds),
        riderLng: coords?.lng,
        riderLat: coords?.lat,
      }),
    onSuccess: (res) => setRouteResult(res),
  });

  const toggleJob = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDist = (km?: number) => {
    if (km === undefined) return '';
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <PageHeader
        eyebrow="Door to door"
        title="Courier recovery"
        subtitle="Don't have time to meet the finder? Request a verified rider to pick up the item and deliver it to you."
      />

      <Stack spacing={2.5}>
        {geoError && (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            {geoError}
          </Alert>
        )}

        <SectionCard
          icon={<TwoWheelerOutlinedIcon />}
          title="Request a delivery"
          desc="Tell us where to collect the item and where it's going."
        >
          <Stack spacing={2}>
            <TextField
              label="Item ID"
              value={form.itemId}
              onChange={(e) => setForm({ ...form, itemId: e.target.value })}
              fullWidth
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Pickup place"
                value={form.pickup}
                onChange={(e) => setForm({ ...form, pickup: e.target.value })}
                sx={{ flex: 1 }}
              />
              <TextField
                label="Drop-off place"
                value={form.dropoff}
                onChange={(e) => setForm({ ...form, dropoff: e.target.value })}
                sx={{ flex: 1 }}
              />
            </Stack>
            <TextField
              label={`Fee (${DEFAULT_CURRENCY})`}
              type="number"
              value={form.fee}
              onChange={(e) => setForm({ ...form, fee: Number(e.target.value) })}
              sx={{ maxWidth: 200 }}
            />
            <Box>
              <Button
                variant="contained"
                onClick={() => request.mutate()}
                disabled={!form.itemId || request.isPending}
                sx={{
                  bgcolor: INK,
                  color: '#FBF6EC',
                  borderRadius: 999,
                  fontWeight: 700,
                  px: 3,
                  '&:hover': { bgcolor: '#0a322e' },
                }}
              >
                {request.isPending ? 'Requesting…' : 'Request a rider'}
              </Button>
            </Box>
          </Stack>
        </SectionCard>

        {/* Open jobs (for couriers) */}
        <Box>
          <Stack
            direction="row"
            spacing={2}
            sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}
          >
            <Typography
              sx={{
                fontFamily: '"Black Ops One", Georgia, serif',
                fontWeight: 600,
                fontSize: 22,
                color: 'text.primary',
              }}
            >
              Open jobs
            </Typography>
            {coords && <Chip label="Sorted by distance" size="small" color="success" />}
          </Stack>

          {selectedIds.size > 0 && (
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
              <Button
                variant="contained"
                onClick={() => planRoute.mutate()}
                disabled={planRoute.isPending}
                startIcon={
                  planRoute.isPending ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <RouteOutlinedIcon />
                  )
                }
                sx={{
                  bgcolor: TEAL,
                  color: '#fff',
                  borderRadius: 999,
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#0c5f59' },
                }}
              >
                Plan route ({selectedIds.size})
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedIds(new Set())}
                sx={{ borderRadius: 999, fontWeight: 600 }}
              >
                Clear
              </Button>
            </Stack>
          )}

          {routeResult && (
            <Box
              sx={{
                mb: 2,
                p: 2.5,
                borderRadius: '18px 18px 18px 4px',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'rgba(15,118,110,0.05)',
              }}
            >
              <Stack spacing={1.5}>
                <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                  Optimized route
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    label={`${routeResult.totalDistanceKm.toFixed(1)} km`}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={`~${routeResult.estimatedDurationMin} min`}
                    color="secondary"
                    size="small"
                  />
                </Stack>
                <Stack spacing={1}>
                  {routeResult.waypoints.map((w, i) => (
                    <Stack key={w.jobId} direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, minWidth: 20, color: 'primary.main' }}
                      >
                        {i + 1}.
                      </Typography>
                      <Typography variant="body2">
                        {w.pickup.name} → {w.dropoff.name}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
                <Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setRouteResult(null)}
                    sx={{ borderRadius: 999 }}
                  >
                    Hide route
                  </Button>
                </Box>
              </Stack>
            </Box>
          )}

          {isLoading ? (
            <CardGridSkeleton count={2} minWidth={300} />
          ) : !data || data.length === 0 ? (
            <EmptyState
              dense
              tone="teal"
              icon={<TwoWheelerOutlinedIcon />}
              title="No open jobs"
              description="There are no courier jobs available right now — check back soon."
            />
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)' },
                gap: 2,
              }}
            >
              {data.map((j) => (
                <Box
                  key={j.id}
                  sx={{
                    p: 2.25,
                    borderRadius: '18px 18px 18px 4px',
                    border: '1px solid',
                    borderColor: selectedIds.has(j.id) ? TEAL : 'divider',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
                      <Checkbox
                        checked={selectedIds.has(j.id)}
                        onChange={() => toggleJob(j.id)}
                        size="small"
                        sx={{ p: 0 }}
                      />
                      <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                        Job {j.id.slice(-6)}
                      </Typography>
                    </Stack>
                    <Button
                      component={Link}
                      to={`/courier/${j.id}`}
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 999, fontWeight: 600, flexShrink: 0 }}
                    >
                      Track
                    </Button>
                  </Stack>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {j.pickup.name} → {j.dropoff.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fee: {j.fee} {j.currency}
                  </Typography>
                  {(j.estimatedDistanceKm !== undefined ||
                    j.estimatedDurationMin !== undefined) && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      {j.estimatedDistanceKm !== undefined && (
                        <Chip
                          label={formatDist(j.estimatedDistanceKm)}
                          size="small"
                          variant="outlined"
                        />
                      )}
                      {j.estimatedDurationMin !== undefined && (
                        <Chip
                          label={`~${j.estimatedDurationMin} min`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Stack>
    </Box>
  );
}
