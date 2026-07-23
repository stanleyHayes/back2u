import { Refresh } from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '../lib/api.js';
import { SimpleChart } from '../components/SimpleChart.js';
import { DonutChart } from '../components/DonutChart.js';
import { HBarChart } from '../components/HBarChart.js';

const ITEM_STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  matched: 'Matched',
  claimed: 'Claimed',
  returned: 'Returned',
  closed: 'Closed',
  archived: 'Archived',
};

const ITEM_STATUS_ORDER = ['open', 'matched', 'claimed', 'returned', 'closed', 'archived'];

function getLast30DayLabels(): string[] {
  const labels: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    labels.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  }
  return labels;
}

export function OverviewPage() {
  const qc = useQueryClient();
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.getAdminStats(),
  });

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const chartLabels = getLast30DayLabels();

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h3" fontWeight={700}>
          Admin overview
        </Typography>
        <Button
          variant="outlined"
          size="small"
          startIcon={isFetching ? <CircularProgress size={16} /> : <Refresh />}
          onClick={handleRefresh}
          disabled={isFetching}
        >
          Refresh
        </Button>
      </Stack>

      <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' }} gap={2}>
        <StatCard label="Total users" value={data?.users} isLoading={isLoading} />
        <StatCard label="Total items" value={data?.itemsTotal} isLoading={isLoading} />
        <StatCard label="Marketplace listings" value={data?.marketplaceListings} isLoading={isLoading} />
        <StatCard label="Marketplace bids" value={data?.marketplaceBids} isLoading={isLoading} />
        <StatCard label="Institutions" value={data?.institutions} isLoading={isLoading} />
        <StatCard label="Courier jobs" value={data?.courierJobs} isLoading={isLoading} />
        <StatCard label="Matches total" value={data?.matchesTotal} isLoading={isLoading} />
        <StatCard
          label="Match success rate"
          value={data?.matchSuccessRate !== undefined ? `${(data.matchSuccessRate * 100).toFixed(1)}%` : undefined}
          isLoading={isLoading}
        />
      </Box>

      <Typography variant="h5" fontWeight={700}>
        Breakdowns
      </Typography>
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3,1fr)' }} gap={2}>
        {isLoading ? (
          <>
            <Skeleton variant="rounded" height={200} />
            <Skeleton variant="rounded" height={200} />
            <Skeleton variant="rounded" height={200} />
          </>
        ) : (
          <>
            <DonutChart
              title="Lost vs found"
              centerLabel="items"
              slices={[
                { label: 'Found', value: data?.itemsByKind.found ?? 0, color: '#2DD4BF' },
                { label: 'Lost', value: data?.itemsByKind.lost ?? 0, color: '#C2410C' },
              ]}
            />
            <DonutChart
              title="Match outcomes"
              centerValue={`${((data?.matchSuccessRate ?? 0) * 100).toFixed(0)}%`}
              centerLabel="accepted"
              slices={[
                { label: 'Accepted', value: data?.matchesAccepted ?? 0, color: '#2DD4BF' },
                {
                  label: 'Pending / rejected',
                  value: Math.max(0, (data?.matchesTotal ?? 0) - (data?.matchesAccepted ?? 0)),
                  color: '#E0A106',
                },
              ]}
            />
            <HBarChart
              title="Items by status"
              color="#2DD4BF"
              data={ITEM_STATUS_ORDER.map((s) => ({ label: ITEM_STATUS_LABELS[s] ?? s, value: data?.itemsByStatus[s] ?? 0 }))}
            />
          </>
        )}
      </Box>

      <Typography variant="h5" fontWeight={700}>
        Top categories
      </Typography>
      <Box>
        {isLoading ? (
          <Skeleton variant="rounded" height={240} />
        ) : (
          <HBarChart
            title="Items by category"
            color="#E0A106"
            data={Object.entries(data?.itemsByCategory ?? {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 8)
              .map(([label, value]) => ({ label, value }))}
          />
        )}
      </Box>

      <Typography variant="h5" fontWeight={700}>
        Last 30 days
      </Typography>
      <Box display="grid" gridTemplateColumns={{ xs: '1fr', lg: 'repeat(3,1fr)' }} gap={2}>
        {isLoading ? (
          <>
            <Skeleton variant="rounded" height={240} />
            <Skeleton variant="rounded" height={240} />
            <Skeleton variant="rounded" height={240} />
          </>
        ) : (
          <>
            <SimpleChart
              title="New users per day"
              data={data?.usersPerDay ?? []}
              labels={chartLabels}
              color="primary.main"
            />
            <SimpleChart
              title="Items posted per day"
              data={data?.itemsPerDay ?? []}
              labels={chartLabels}
              color="success.main"
            />
            <SimpleChart
              title="Matches per day"
              data={data?.matchesPerDay ?? []}
              labels={chartLabels}
              color="warning.main"
            />
          </>
        )}
      </Box>
    </Stack>
  );
}

function StatCard({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: number | string | undefined;
  isLoading: boolean;
}) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        {isLoading ? (
          <Skeleton variant="text" width="40%" height={40} />
        ) : (
          <Typography variant="h3" fontWeight={700}>
            {value ?? 0}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
