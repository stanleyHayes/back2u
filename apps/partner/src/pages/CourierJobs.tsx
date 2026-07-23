import { Alert, Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { EmptyState, CardGridSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';

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
      <Box>
        <Typography sx={{ color: '#2DD4BF', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontSize: 12, mb: 0.5 }}>
          Logistics
        </Typography>
        <Typography sx={{ fontFamily: '"Fraunces", Georgia, serif', fontWeight: 600, fontSize: 28, color: '#F3F6FB' }}>
          Open courier jobs
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 620 }}>
          Delivery requests waiting for a runner. Accept a job to assign it to your desk, then collect with the
          pickup code and hand off with the delivery code.
        </Typography>
      </Box>

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
          actions={[{ label: 'Retry', onClick: () => qc.invalidateQueries({ queryKey: ['partner-courier'] }) }]}
        />
      ) : jobs.length === 0 ? (
        <EmptyState
          tone="teal"
          icon={<LocalShippingOutlinedIcon />}
          title="No open courier jobs"
          description="When a finder requests a delivery, the job will appear here for your desk to accept."
        />
      ) : (
        <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2,1fr)' }} gap={2}>
          {jobs.map((j) => (
            <Card
              key={j.id}
              sx={{ borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', bgcolor: 'background.paper' }}
            >
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontWeight: 700, color: '#F3F6FB' }}>Job {j.id.slice(-6)}</Typography>
                  <Chip
                    label={`${j.fee} ${j.currency}`}
                    size="small"
                    sx={{ bgcolor: 'rgba(45,212,191,0.12)', color: '#2DD4BF', fontWeight: 700 }}
                  />
                </Stack>
                <Stack spacing={1}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <PlaceOutlinedIcon sx={{ fontSize: 18, color: '#2DD4BF', mt: '2px' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Pickup</Typography>
                      <Typography variant="body2" sx={{ color: '#E5E9F0' }}>{j.pickup.name}</Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <PlaceOutlinedIcon sx={{ fontSize: 18, color: '#E0A106', mt: '2px' }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary">Drop-off</Typography>
                      <Typography variant="body2" sx={{ color: '#E5E9F0' }}>{j.dropoff.name}</Typography>
                    </Box>
                  </Stack>
                </Stack>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 2 }}
                  disabled={accept.isPending}
                  onClick={() => accept.mutate(j.id)}
                >
                  {accept.isPending && accept.variables === j.id ? 'Accepting…' : 'Accept job'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Stack>
  );
}
