import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { EmptyState, PageHeader, CardGridSkeleton } from '@back2u/ui-web';
import type { CourierJobDTO } from '@back2u/shared-types';

import { api } from '../lib/api.js';

function RouteStop({
  marker,
  label,
  name,
  sub,
}: {
  marker: React.ReactNode;
  label: string;
  name: string;
  sub?: string;
}) {
  return (
    <>
      <Box sx={{ display: 'grid', placeItems: 'center', height: 22 }}>{marker}</Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600, color: 'text.primary', lineHeight: 1.35 }}>
          {name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {label}
          {sub ? ` · ${sub}` : ''}
        </Typography>
      </Box>
    </>
  );
}

function CourierJobCard({
  job,
  pending,
  accepting,
  onAccept,
}: {
  job: CourierJobDTO;
  pending: boolean;
  accepting: boolean;
  onAccept: () => void;
}) {
  return (
    <Card
      sx={{
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Header: icon tile + job id + status */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1,
              flexShrink: 0,
              display: 'grid',
              placeItems: 'center',
              bgcolor: 'rgba(45,212,191,0.12)',
              color: '#2DD4BF',
            }}
          >
            <LocalShippingOutlinedIcon sx={{ fontSize: 22 }} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 700, color: 'text.primary', lineHeight: 1.2 }}>
              Job #{job.id.slice(-6)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(job.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
          <Chip
            label={job.status.replace(/_/g, ' ')}
            size="small"
            sx={{
              textTransform: 'capitalize',
              bgcolor: 'rgba(45,212,191,0.12)',
              color: '#2DD4BF',
              fontWeight: 700,
            }}
          />
        </Stack>

        {/* Route: dot — dotted connector — pin */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '22px 1fr',
            columnGap: 1.25,
            rowGap: 0.5,
            px: 0.5,
          }}
        >
          <RouteStop
            marker={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#2DD4BF' }} />}
            label="Pickup"
            name={job.pickup.name}
            sub={job.pickup.city}
          />
          <Box
            sx={{
              width: 0,
              height: 18,
              justifySelf: 'center',
              borderLeft: '2px dotted rgba(128,128,128,0.5)',
            }}
          />
          <Box />
          <RouteStop
            marker={<PlaceOutlinedIcon sx={{ fontSize: 16, color: '#E0A106' }} />}
            label="Drop-off"
            name={job.dropoff.name}
            sub={job.dropoff.city}
          />
        </Box>

        {/* Footer: fee + distance + accept */}
        <Stack
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0 }}>
            <Chip
              label={`${job.fee} ${job.currency}`}
              size="small"
              sx={{ bgcolor: 'rgba(224,161,6,0.14)', color: '#E0A106', fontWeight: 700 }}
            />
            {typeof job.estimatedDistanceKm === 'number' && (
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {job.estimatedDistanceKm.toFixed(1)} km
              </Typography>
            )}
          </Stack>
          <Button variant="contained" size="small" disabled={pending} onClick={onAccept}>
            {accepting ? 'Accepting…' : 'Accept job'}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function CourierJobsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['partner-courier'],
    queryFn: () => api.listOpenCourierJobs(),
  });
  const accept = useMutation({
    mutationFn: (id: string) => api.acceptCourierJob(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-courier'] }),
  });
  const jobs = data ?? [];

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<LocalShippingOutlinedIcon />}
        title="Open courier jobs"
        description="Delivery requests waiting for a runner. Accept a job to assign it to your desk, then collect with the pickup code and hand off with the delivery code."
      />

      {accept.isError && (
        <Alert severity="error">Could not accept that job — it may have just been taken.</Alert>
      )}

      {isLoading ? (
        <CardGridSkeleton count={4} minWidth={300} />
      ) : error ? (
        <EmptyState
          tone="clay"
          icon={<LocalShippingOutlinedIcon />}
          title="Couldn't load courier jobs"
          description="Something went wrong fetching open delivery requests. Try again in a moment."
          actions={[
            {
              label: 'Retry',
              onClick: () => qc.invalidateQueries({ queryKey: ['partner-courier'] }),
            },
          ]}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          tone="teal"
          icon={<LocalShippingOutlinedIcon />}
          title="No open courier jobs"
          description="When a finder requests a delivery, the job will appear here for your desk to accept."
        />
      ) : (
        <Box
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)' }, gap: 2 }}
        >
          {jobs.map((j) => (
            <CourierJobCard
              key={j.id}
              job={j}
              pending={accept.isPending}
              accepting={accept.isPending && accept.variables === j.id}
              onAccept={() => accept.mutate(j.id)}
            />
          ))}
        </Box>
      )}
    </Stack>
  );
}
