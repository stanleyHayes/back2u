import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  InputAdornment,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import RouteOutlinedIcon from '@mui/icons-material/RouteOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import type { CourierJobDTO } from '@back2u/shared-types';
import { api } from '../lib/api.js';

const heading = { fontFamily: 'Outfit, sans-serif', fontWeight: 600, letterSpacing: '-.025em' };

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
    <Box
      component="article"
      sx={{
        bgcolor: 'background.default',
        borderRadius: '24px',
        boxShadow: 'var(--courier-raised)',
        p: { xs: 2.5, md: 3 },
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 2.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '14px',
            flexShrink: 0,
            boxShadow: 'var(--courier-inset)',
            color: 'var(--courier-green)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <LocalShippingOutlinedIcon sx={{ fontSize: 23 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography component="h2" sx={{ ...heading, fontSize: 17 }}>
            Job #{job.id.slice(-6)}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 11, mt: 0.4 }}>
            {new Date(job.createdAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </Typography>
        </Box>
        <Box
          sx={{
            color: 'var(--courier-green)',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'capitalize',
            px: 1.25,
            py: 0.65,
            borderRadius: '9px',
            bgcolor: 'action.hover',
          }}
        >
          {job.status.replace(/_/g, ' ')}
        </Box>
      </Stack>
      <Box
        sx={{ borderRadius: '18px', boxShadow: 'var(--courier-inset)', p: 2.25, flex: 1, mb: 2.5 }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: '20px minmax(0, 1fr)', columnGap: 1.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                border: '2px solid',
                borderColor: 'var(--courier-green)',
              }}
            />
            <Box
              sx={{
                borderLeft: '1px dashed',
                borderColor: 'divider',
                flex: 1,
                minHeight: 28,
                mt: 1,
                mb: 0.75,
              }}
            />
          </Box>
          <Box sx={{ pb: 2.5 }}>
            <Typography
              sx={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                color: 'text.secondary',
                mb: 0.5,
              }}
            >
              Pickup
            </Typography>
            <Typography
              sx={{ ...heading, fontSize: 18, lineHeight: 1.4, overflowWrap: 'anywhere' }}
            >
              {job.pickup.name}
            </Typography>
            {job.pickup.city && job.pickup.city !== job.pickup.name && (
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.4 }}>
                {job.pickup.city}
              </Typography>
            )}
          </Box>
          <PlaceOutlinedIcon sx={{ color: 'var(--courier-amber)', fontSize: 20, mt: 0.25 }} />
          <Box>
            <Typography
              sx={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                color: 'text.secondary',
                mb: 0.5,
              }}
            >
              Drop-off
            </Typography>
            <Typography
              sx={{ ...heading, fontSize: 18, lineHeight: 1.4, overflowWrap: 'anywhere' }}
            >
              {job.dropoff.name}
            </Typography>
            {job.dropoff.city && job.dropoff.city !== job.dropoff.name && (
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.4 }}>
                {job.dropoff.city}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
      {(typeof job.estimatedDistanceKm === 'number' ||
        typeof job.estimatedDurationMin === 'number') && (
        <Stack
          direction="row"
          spacing={2}
          useFlexGap
          sx={{ flexWrap: 'wrap', color: 'text.secondary', mb: 2 }}
        >
          {typeof job.estimatedDistanceKm === 'number' && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <RouteOutlinedIcon sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: 11 }}>
                {job.estimatedDistanceKm.toFixed(1)} km estimated
              </Typography>
            </Stack>
          )}
          {typeof job.estimatedDurationMin === 'number' && (
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
              <AccessTimeRoundedIcon sx={{ fontSize: 16 }} />
              <Typography sx={{ fontSize: 11 }}>
                {Math.round(job.estimatedDurationMin)} min estimated
              </Typography>
            </Stack>
          )}
        </Stack>
      )}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box>
          <Typography sx={{ fontSize: 11, color: 'text.secondary', mb: 0.5 }}>
            Delivery fee
          </Typography>
          <Typography sx={{ ...heading, fontSize: 26, lineHeight: 1.2, overflowWrap: 'anywhere' }}>
            <Box
              component="span"
              sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mr: 0.75 }}
            >
              {job.currency}
            </Box>
            {job.fee.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Typography>
        </Box>
        <Button
          variant="contained"
          disabled={pending}
          onClick={onAccept}
          aria-label={`${accepting ? 'Accepting' : 'Accept'} job ${job.id.slice(-6)}`}
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{ borderRadius: '13px', minHeight: 44, px: 2, fontSize: 12, flexShrink: 0 }}
        >
          {accepting ? 'Accepting…' : 'Accept job'}
        </Button>
      </Stack>
    </Box>
  );
}

export function CourierJobsPage() {
  const dark = useTheme().palette.mode === 'dark';
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [accepted, setAccepted] = useState<string | null>(null);
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ['partner-courier'],
    queryFn: () => api.listOpenCourierJobs(),
  });
  const accept = useMutation({
    mutationFn: (id: string) => api.acceptCourierJob(id),
    onMutate: () => setAccepted(null),
    onSuccess: async (_data, id) => {
      setAccepted(id.slice(-6));
      await qc.invalidateQueries({ queryKey: ['partner-courier'] });
    },
  });
  const jobs = data ?? [];
  const query = search.trim().toLowerCase();
  const visibleJobs = jobs.filter((job) =>
    [job.id, job.pickup.name, job.pickup.city, job.dropoff.name, job.dropoff.city].some((value) =>
      value?.toLowerCase().includes(query),
    ),
  );
  return (
    <Stack
      component="main"
      spacing={3}
      sx={{
        '--courier-green': dark ? '#B0C9A5' : '#42633E',
        '--courier-amber': dark ? '#DCB88C' : '#926031',
        '--courier-raised': dark
          ? '7px 7px 18px rgba(0,0,0,.28), -5px -5px 15px rgba(105,128,91,.08)'
          : '7px 7px 18px #dcded5, -5px -5px 15px #ffffff',
        '--courier-inset': dark
          ? 'inset 3px 3px 8px rgba(0,0,0,.32), inset -3px -3px 8px rgba(105,128,91,.10)'
          : 'inset 3px 3px 8px #dcded5, inset -3px -3px 8px #ffffff',
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { sm: 'center' } }}
      >
        <Box>
          <Typography
            sx={{
              color: 'text.secondary',
              fontSize: 11,
              letterSpacing: '.14em',
              fontWeight: 700,
              mb: 1,
            }}
          >
            COURIER DISPATCH
          </Typography>
          <Typography
            component="h1"
            sx={{ ...heading, fontSize: { xs: 30, md: 38 }, lineHeight: 1.2 }}
          >
            The next leg of the reunion.
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 1 }}>
            Review open deliveries and choose the next job for your desk.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshRoundedIcon />}
          disabled={isFetching}
          onClick={() => refetch()}
          sx={{
            borderRadius: '14px',
            px: 2.5,
            py: 1.25,
            alignSelf: { xs: 'flex-start', sm: 'auto' },
            flexShrink: 0,
          }}
        >
          {isFetching ? 'Refreshing…' : 'Refresh'}
        </Button>
      </Stack>
      <Box
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: '24px',
          boxShadow: 'var(--courier-raised)',
          bgcolor: 'background.default',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2.5}
          sx={{ alignItems: { md: 'center' }, justifyContent: 'space-between' }}
        >
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '15px',
                boxShadow: 'var(--courier-inset)',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--courier-green)',
              }}
            >
              <LocalShippingOutlinedIcon />
            </Box>
            <Box>
              <Typography sx={{ ...heading, fontSize: 22 }}>
                {isPending
                  ? 'Loading jobs…'
                  : data
                    ? `${jobs.length} open ${jobs.length === 1 ? 'job' : 'jobs'}`
                    : 'Jobs unavailable'}
              </Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', mt: 0.4 }}>
                Requests waiting for a courier
              </Typography>
            </Box>
          </Stack>
          <TextField
            label="Search routes"
            placeholder="Pickup, drop-off or job reference"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            size="small"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRoundedIcon sx={{ fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              width: { xs: '100%', md: 350 },
              '& .MuiOutlinedInput-root': { borderRadius: '14px', minHeight: 48 },
            }}
          />
        </Stack>
      </Box>
      {accepted && (
        <Alert severity="success" onClose={() => setAccepted(null)}>
          Job #{accepted} accepted. The open-job list has been refreshed.
        </Alert>
      )}
      {accept.isError && (
        <Alert severity="error" onClose={() => accept.reset()}>
          Could not accept that job. It may no longer be available; refresh the list and try again.
        </Alert>
      )}
      {isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => refetch()} disabled={isFetching}>
              Retry
            </Button>
          }
        >
          Open jobs could not be loaded.
          {data ? ' Showing the last available list.' : ' Please try again.'}
        </Alert>
      )}
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Typography component="h2" sx={{ ...heading, fontSize: 21 }}>
          Available deliveries
        </Typography>
        <Typography role="status" sx={{ color: 'text.secondary', fontSize: 12 }}>
          {isFetching
            ? 'Updating…'
            : data
              ? `${visibleJobs.length} ${query ? 'matching' : 'available'}`
              : 'Unavailable'}
        </Typography>
      </Stack>
      {isPending ? (
        <Box
          aria-label="Loading delivery requests"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 2.5,
          }}
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Box
              key={index}
              sx={{ p: 3, borderRadius: '24px', boxShadow: 'var(--courier-raised)' }}
            >
              <Skeleton width="60%" height={35} />
              <Skeleton variant="rounded" height={155} sx={{ my: 2 }} />
              <Skeleton height={40} />
            </Box>
          ))}
        </Box>
      ) : data && visibleJobs.length === 0 ? (
        <Stack
          spacing={1.5}
          sx={{
            alignItems: 'center',
            textAlign: 'center',
            p: { xs: 3, md: 5 },
            borderRadius: '24px',
            boxShadow: 'var(--courier-inset)',
          }}
        >
          <LocalShippingOutlinedIcon sx={{ fontSize: 42, color: 'var(--courier-green)' }} />
          <Typography component="h3" sx={{ ...heading, fontSize: 24 }}>
            {query ? 'No routes match your search' : 'Ready for the next delivery'}
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, maxWidth: 390 }}>
            {query
              ? 'Try a different place or job reference.'
              : 'New delivery requests will appear here when a finder needs a courier.'}
          </Typography>
          {query && <Button onClick={() => setSearch('')}>Clear search</Button>}
        </Stack>
      ) : data ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 2.5,
          }}
        >
          {visibleJobs.map((job) => (
            <CourierJobCard
              key={job.id}
              job={job}
              pending={accept.isPending}
              accepting={accept.isPending && accept.variables === job.id}
              onAccept={() => accept.mutate(job.id)}
            />
          ))}
        </Box>
      ) : null}
      <Box sx={{ borderRadius: '24px', p: { xs: 2.5, md: 3 }, boxShadow: 'var(--courier-inset)' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
          <VerifiedUserOutlinedIcon sx={{ color: 'var(--courier-green)', fontSize: 21 }} />
          <Typography component="h2" sx={{ ...heading, fontSize: 18 }}>
            A verified handover at both ends
          </Typography>
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
            gap: 2.5,
          }}
        >
          {[
            {
              title: 'Accept the job',
              body: 'Check the route and fee before taking responsibility for the delivery.',
            },
            {
              title: 'Collect with the pickup code',
              body: 'Use the pickup code to confirm the item handover.',
            },
            {
              title: 'Confirm the delivery',
              body: 'Use the delivery code when handing the item to its recipient.',
            },
          ].map((step, index) => (
            <Stack key={step.title} direction="row" spacing={1.25}>
              <Typography
                sx={{ color: 'var(--courier-green)', fontSize: 12, fontWeight: 700, pt: 0.2 }}
              >
                {String(index + 1).padStart(2, '0')}
              </Typography>
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{step.title}</Typography>
                <Typography
                  sx={{ fontSize: 12, lineHeight: 1.7, color: 'text.secondary', mt: 0.75 }}
                >
                  {step.body}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Box>
      </Box>
    </Stack>
  );
}
