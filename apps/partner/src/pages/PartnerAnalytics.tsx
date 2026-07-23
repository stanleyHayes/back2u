import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import RefreshIcon from '@mui/icons-material/Refresh';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import { EmptyState, PageHeader, StatCardsSkeleton, ListSkeleton } from '@back2u/ui-web';

import { api } from '../lib/api.js';

const STATUS_COLORS: Record<string, string> = {
  open: '#1976d2',
  matched: '#ed6c02',
  claimed: '#9c27b0',
  returned: '#2e7d32',
  closed: '#757575',
  archived: '#bdbdbd',
};

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {value.toLocaleString()}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function SimpleBarChart({ data }: { data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <Stack spacing={1}>
      {entries.map(([status, count]) => (
        <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ width: 70, textTransform: 'capitalize' }}>
            {status}
          </Typography>
          <Box
            sx={{
              flex: 1,
              bgcolor: 'action.hover',
              borderRadius: 1,
              overflow: 'hidden',
              height: 20,
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: `${(count / max) * 100}%`,
                bgcolor: STATUS_COLORS[status] ?? '#90a4ae',
                borderRadius: 1,
              }}
            />
          </Box>
          <Typography variant="caption" sx={{ width: 40, textAlign: 'right' }}>
            {count}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

export function PartnerAnalyticsPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['partner-stats'],
    queryFn: () => api.getPartnerStats(),
  });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries({ queryKey: ['partner-stats'] });
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <Stack spacing={3}>
        <StatCardsSkeleton count={6} />
        <ListSkeleton rows={4} avatar={false} />
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack spacing={2}>
        <PageHeader
          icon={<InsightsOutlinedIcon />}
          title="Analytics"
          description="Turnaround and redemption metrics for your institution."
        />
        <Typography color="error">Failed to load analytics.</Typography>
        <Button variant="outlined" onClick={handleRefresh} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Stack>
    );
  }

  const stats = data!;

  return (
    <Stack spacing={3}>
      <PageHeader
        icon={<InsightsOutlinedIcon />}
        title="Analytics"
        description="Turnaround and redemption metrics for your institution."
        actions={
          <Button
            variant="outlined"
            size="small"
            onClick={handleRefresh}
            disabled={refreshing}
            startIcon={refreshing ? <CircularProgress size={14} /> : <RefreshIcon />}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 2,
        }}
      >
        <StatCard label="Total items" value={stats.totalItems} />
        <StatCard label="Open items" value={stats.openItems} />
        <StatCard label="Matched" value={stats.matchedItems} />
        <StatCard label="Returned" value={stats.returnedItems} />
        <StatCard
          label="Redemptions"
          value={stats.totalRedemptions}
          sub={`${stats.totalPointsRedeemed.toLocaleString()} pts`}
        />
        <StatCard
          label="Courier jobs"
          value={stats.totalCourierJobs}
          sub={`${stats.activeCourierJobs} active`}
        />
      </Box>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
            Items by status
          </Typography>
          <SimpleBarChart data={stats.itemsByStatus} />
        </CardContent>
      </Card>

      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 2 }}
      >
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Recent items
            </Typography>
            {stats.recentItems.length === 0 && (
              <EmptyState
                dense
                tone="teal"
                icon={<Inventory2OutlinedIcon />}
                title="No items yet"
                description="Reported items will appear here."
              />
            )}
            <Stack spacing={1}>
              {stats.recentItems.map((item) => (
                <Box key={item.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip label={item.status} size="small" sx={{ textTransform: 'capitalize' }} />
                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ fontWeight: 700 }} gutterBottom>
              Recent redemptions
            </Typography>
            {stats.recentRedemptions.length === 0 && (
              <EmptyState
                dense
                tone="marigold"
                icon={<ConfirmationNumberOutlinedIcon />}
                title="No redemptions yet"
                description="Confirmed point exchanges will appear here."
              />
            )}
            <Stack spacing={1}>
              {stats.recentRedemptions.map((r) => (
                <Box key={r.id} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={r.status}
                    size="small"
                    color={
                      r.status === 'fulfilled'
                        ? 'success'
                        : r.status === 'pending'
                          ? 'warning'
                          : 'default'
                    }
                  />
                  <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                    {r.code}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {r.points} pts
                  </Typography>
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Stack>
  );
}
