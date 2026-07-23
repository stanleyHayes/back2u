import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Step,
  StepLabel,
  Stepper,
  Typography,
  Stack,
} from '@mui/material';
import { ArrowForward, LocationOn } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import type { CourierStatus } from '@back2u/shared-types';
import { DetailSkeleton } from '@back2u/ui-web';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

const STATUS_ORDER: CourierStatus[] = [
  'requested',
  'accepted',
  'picked_up',
  'in_transit',
  'delivered',
];

const STATUS_LABELS: Record<CourierStatus, string> = {
  requested: 'Requested',
  accepted: 'Accepted',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<
  CourierStatus,
  'default' | 'primary' | 'success' | 'error' | 'warning' | 'info'
> = {
  requested: 'default',
  accepted: 'info',
  picked_up: 'warning',
  in_transit: 'primary',
  delivered: 'success',
  cancelled: 'error',
};

export function CourierTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const {
    data: job,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['courier-job', id],
    queryFn: () => api.getCourierJob(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box sx={{ mt: 2 }}>
        <DetailSkeleton />
      </Box>
    );
  }

  if (error || !job) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error instanceof Error ? error.message : 'Failed to load courier job.'}
      </Alert>
    );
  }

  const isCancelled = job.status === 'cancelled';
  const activeStep = isCancelled ? -1 : STATUS_ORDER.indexOf(job.status);
  const isRequester = user?.id === job.requesterId;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Courier Job
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Chip label={STATUS_LABELS[job.status]} color={STATUS_COLORS[job.status]} />
          <Typography variant="body2" color="text.secondary">
            ID: {job.id}
          </Typography>
        </Stack>
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1} alignItems="center" flex={1}>
              <LocationOn color="primary" />
              <Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {job.pickup.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {[job.pickup.city, job.pickup.country].filter(Boolean).join(', ')}
                </Typography>
              </Box>
            </Stack>

            <Box display="flex" justifyContent="center" width={{ xs: '100%', sm: 'auto' }}>
              <ArrowForward color="action" />
            </Box>

            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              flex={1}
              justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}
            >
              <Box textAlign={{ xs: 'left', sm: 'right' }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  {job.dropoff.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {[job.dropoff.city, job.dropoff.country].filter(Boolean).join(', ')}
                </Typography>
              </Box>
              <LocationOn color="success" />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {isCancelled ? (
        <Alert severity="error">
          <Typography variant="subtitle1" fontWeight={600}>
            This job has been cancelled.
          </Typography>
        </Alert>
      ) : (
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Delivery Progress
            </Typography>
            <Stepper activeStep={activeStep} orientation="vertical">
              {STATUS_ORDER.map((status, index) => {
                const isCurrent = index === activeStep;
                return (
                  <Step key={status} completed={index < activeStep} active={isCurrent}>
                    <StepLabel>
                      <Typography
                        variant="body1"
                        fontWeight={isCurrent ? 700 : 400}
                        color={isCurrent ? 'text.primary' : 'text.secondary'}
                      >
                        {STATUS_LABELS[status]}
                      </Typography>
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </CardContent>
        </Card>
      )}

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Details
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body1">
              <strong>Fee:</strong> {job.fee} {job.currency}
            </Typography>
            <Typography variant="body1">
              <strong>Item ID:</strong>{' '}
              <Button component={Link} to={`/items/${job.itemId}`} size="small">
                {job.itemId}
              </Button>
            </Typography>
            <Typography variant="body1">
              <strong>Created:</strong> {new Date(job.createdAt).toLocaleString()}
            </Typography>
            {job.riderId && (
              <Typography variant="body1">
                <strong>Rider ID:</strong> {job.riderId}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      {job.status === 'requested' && isRequester && (
        <Box>
          <Button variant="outlined" color="error">
            Cancel Job
          </Button>
        </Box>
      )}
    </Stack>
  );
}
