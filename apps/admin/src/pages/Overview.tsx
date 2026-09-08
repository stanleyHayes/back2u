import { Link as RouterLink } from 'react-router-dom';
import {
  PeopleOutlined,
  Inventory2Outlined,
  StorefrontOutlined,
  LocalShippingOutlined,
  HandshakeOutlined,
  TrendingUp,
  GavelOutlined,
  VerifiedUserOutlined,
  ArrowForwardRounded,
} from '@mui/icons-material';
import { Alert } from '@mui/material';
import { AdminWorkspace, WorkspaceHeader as PageHeader } from '../components/AdminWorkspace.js';
import { Refresh } from '@mui/icons-material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
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

function OverviewPageContent() {
  const qc = useQueryClient();
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.getAdminStats(),
  });

  const handleRefresh = () => {
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const chartLabels = getLast30DayLabels();

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<DashboardOutlinedIcon />}
        title="Admin overview"
        description="Live platform health — users, items, matches and marketplace activity at a glance."
        actions={
          <Button
            variant="outlined"
            size="small"
            startIcon={isFetching ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={isFetching}
          >
            Refresh
          </Button>
        }
      />

      {isError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={handleRefresh}>
              Retry
            </Button>
          }
        >
          Platform statistics could not be loaded.
        </Alert>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.3fr 1fr' }, gap: 2 }}>
        <Box
          sx={{
            p: { xs: 2.5, md: 3 },
            borderRadius: '24px',
            boxShadow: 'var(--workspace-raised)',
            bgcolor: 'background.default',
          }}
        >
          <Typography
            sx={{ color: 'var(--workspace-green)', fontSize: 12, fontWeight: 600, mb: 1 }}
          >
            PLATFORM PULSE
          </Typography>
          <Typography
            sx={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: { xs: 24, md: 30 },
              fontWeight: 600,
              letterSpacing: '-.03em',
            }}
          >
            Every recovery starts with trust.
          </Typography>
          <Typography sx={{ color: 'text.secondary', fontSize: 14, lineHeight: 1.7, mt: 1 }}>
            Follow platform activity below, or head straight to the queues that need a human
            decision.
          </Typography>
        </Box>
        <Stack
          spacing={1.5}
          sx={{ p: 2, borderRadius: '24px', boxShadow: 'var(--workspace-inset)' }}
        >
          {[
            {
              to: '/verifications',
              title: 'Ownership verifications',
              desc: 'Review claimant evidence',
              icon: <VerifiedUserOutlined />,
            },
            {
              to: '/moderation',
              title: 'Moderation queue',
              desc: 'Review flagged content',
              icon: <GavelOutlined />,
            },
          ].map((link) => (
            <Button
              key={link.to}
              component={RouterLink}
              to={link.to}
              color="inherit"
              sx={{ justifyContent: 'flex-start', textAlign: 'left', p: 1.5, gap: 1.5 }}
              startIcon={link.icon}
            >
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{link.title}</Typography>
                <Typography sx={{ fontSize: 12, color: 'text.secondary' }}>{link.desc}</Typography>
              </Box>
              <ArrowForwardRounded sx={{ fontSize: 18 }} />
            </Button>
          ))}
        </Stack>
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', lg: 'repeat(4,1fr)' },
          gap: 2,
        }}
      >
        <StatCard label="Total users" value={data?.users} isLoading={isLoading} />
        <StatCard label="Total items" value={data?.itemsTotal} isLoading={isLoading} />
        <StatCard
          label="Marketplace listings"
          value={data?.marketplaceListings}
          isLoading={isLoading}
        />
        <StatCard label="Marketplace bids" value={data?.marketplaceBids} isLoading={isLoading} />
        <StatCard label="Institutions" value={data?.institutions} isLoading={isLoading} />
        <StatCard label="Courier jobs" value={data?.courierJobs} isLoading={isLoading} />
        <StatCard label="Matches total" value={data?.matchesTotal} isLoading={isLoading} />
        <StatCard
          label="Match success rate"
          value={
            data?.matchSuccessRate !== undefined
              ? `${(data.matchSuccessRate * 100).toFixed(1)}%`
              : undefined
          }
          isLoading={isLoading}
        />
      </Box>

      {!isError && (
        <>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Recovery activity
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' },
              gap: 2,
            }}
          >
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
                    { label: 'Found', value: data?.itemsByKind.found ?? 0, color: '#A8B5A0' },
                    { label: 'Lost', value: data?.itemsByKind.lost ?? 0, color: '#C2410C' },
                  ]}
                />
                <DonutChart
                  title="Match outcomes"
                  centerValue={`${((data?.matchSuccessRate ?? 0) * 100).toFixed(0)}%`}
                  centerLabel="accepted"
                  slices={[
                    { label: 'Accepted', value: data?.matchesAccepted ?? 0, color: '#A8B5A0' },
                    {
                      label: 'Pending / rejected',
                      value: Math.max(0, (data?.matchesTotal ?? 0) - (data?.matchesAccepted ?? 0)),
                      color: '#8B6F4E',
                    },
                  ]}
                />
                <HBarChart
                  title="Items by status"
                  color="#A8B5A0"
                  data={ITEM_STATUS_ORDER.map((s) => ({
                    label: ITEM_STATUS_LABELS[s] ?? s,
                    value: data?.itemsByStatus[s] ?? 0,
                  }))}
                />
              </>
            )}
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Top categories
          </Typography>
          <Box>
            {isLoading ? (
              <Skeleton variant="rounded" height={240} />
            ) : (
              <HBarChart
                title="Items by category"
                color="#8B6F4E"
                data={Object.entries(data?.itemsByCategory ?? {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([label, value]) => ({ label, value }))}
              />
            )}
          </Box>

          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Last 30 days
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: 'repeat(3,1fr)' },
              gap: 2,
            }}
          >
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
        </>
      )}
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
        <Stack
          direction="row"
          sx={{ justifyContent: 'space-between', alignItems: 'center', gap: 1, mb: 2 }}
        >
          <Typography sx={{ fontSize: 12, fontWeight: 500, color: 'text.secondary' }}>
            {label}
          </Typography>
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: '11px',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--workspace-green)',
              boxShadow: 'var(--workspace-inset)',
              '& svg': { fontSize: 19 },
            }}
          >
            {label === 'Total users' ? (
              <PeopleOutlined />
            ) : label === 'Total items' ? (
              <Inventory2Outlined />
            ) : label === 'Courier jobs' ? (
              <LocalShippingOutlined />
            ) : label.includes('Match') ? (
              <HandshakeOutlined />
            ) : label === 'Institutions' ? (
              <StorefrontOutlined />
            ) : (
              <TrendingUp />
            )}
          </Box>
        </Stack>
        {isLoading ? (
          <Skeleton variant="text" width="40%" height={40} />
        ) : (
          <Typography
            variant="h3"
            sx={{ fontWeight: 600, fontSize: 34, fontVariantNumeric: 'tabular-nums' }}
          >
            {typeof value === 'number' ? value.toLocaleString() : (value ?? '—')}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export function OverviewPage() {
  return (
    <AdminWorkspace>
      <OverviewPageContent />
    </AdminWorkspace>
  );
}
