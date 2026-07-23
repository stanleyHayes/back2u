import { Box, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import { PageHeader } from '@back2u/ui-web';

import { api } from './lib/api.js';
import { useAuth } from './lib/auth.store.js';
import { PartnerLayout } from './components/PartnerLayout.js';
import { DonutChart } from './components/DonutChart.js';
import { HBarChart } from './components/HBarChart.js';
import { BulkMintTagsPage } from './pages/BulkMintTags.js';
import { CourierJobsPage } from './pages/CourierJobs.js';
import { LoginPage } from './pages/Login.js';
import { PartnerAnalyticsPage } from './pages/PartnerAnalytics.js';
import { PartnerItemsPage } from './pages/PartnerItems.js';
import { PartnerItemDetailPage } from './pages/PartnerItemDetail.js';
import { RedeemPointsPage } from './pages/RedeemPoints.js';
import { RewardsProfilePage } from './pages/RewardsProfile.js';
import { BillingPage } from './pages/Billing.js';
import { PartnerNotificationsPage } from './pages/PartnerNotifications.js';
import { PartnerProfilePage } from './pages/PartnerProfile.js';
import { PartnerSettingsPage } from './pages/PartnerSettings.js';

const STATUS_ORDER = ['open', 'matched', 'claimed', 'returned', 'closed', 'archived'];

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }}>{label}</Typography>
      <Typography
        sx={{
          fontFamily: '"Black Ops One", Georgia, serif',
          fontWeight: 600,
          fontSize: 34,
          color: 'text.primary',
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function Overview() {
  const { data } = useQuery({
    queryKey: ['partner-items'],
    queryFn: () => api.listItems({ pageSize: 100 }),
  });
  const items = data?.items ?? [];
  const catCounts = items.reduce<Record<string, number>>((acc, i) => {
    acc[i.category] = (acc[i.category] ?? 0) + 1;
    return acc;
  }, {});
  const topCategories = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));
  return (
    <Box>
      <PageHeader
        icon={<DashboardOutlinedIcon />}
        title="Welcome back"
        description="Lost & found tracking for your institution. Filter by your venue, view turn-around metrics, redeem finder points at your storefronts, and accept courier delivery jobs."
      />
      <Box
        sx={{
          mt: 3,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3,1fr)' },
          gap: 2,
        }}
      >
        <StatCard label="Reported here" value={data?.total ?? 0} />
        <StatCard
          label="Awaiting collection"
          value={items.filter((i) => i.status === 'matched').length}
        />
        <StatCard label="Returned" value={items.filter((i) => i.status === 'returned').length} />
      </Box>

      <Typography
        sx={{
          fontFamily: '"Black Ops One", Georgia, serif',
          fontWeight: 600,
          fontSize: 22,
          color: 'text.primary',
          mt: 4,
          mb: 2,
        }}
      >
        Breakdowns
      </Typography>
      <Box
        sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3,1fr)' }, gap: 2 }}
      >
        <DonutChart
          title="Lost vs found"
          centerLabel="items"
          slices={[
            {
              label: 'Found',
              value: items.filter((i) => i.kind === 'found').length,
              color: '#2DD4BF',
            },
            {
              label: 'Lost',
              value: items.filter((i) => i.kind === 'lost').length,
              color: '#C2410C',
            },
          ]}
        />
        <HBarChart
          title="Items by status"
          color="#2DD4BF"
          data={STATUS_ORDER.map((s) => ({
            label: s.charAt(0).toUpperCase() + s.slice(1),
            value: items.filter((i) => i.status === s).length,
          }))}
        />
        <HBarChart title="Top categories" color="#E0A106" data={topCategories} />
      </Box>
    </Box>
  );
}

export function App() {
  const { user, clear } = useAuth();

  // Revalidate the persisted session once on mount: a stale/tampered
  // localStorage entry must not unlock the console.
  useEffect(() => {
    if (!user) return;
    api
      .me()
      .then((me) => {
        const allowed = me.roles.some(
          (r) => r === 'partner_admin' || r === 'admin' || r === 'super_admin' || r === 'courier',
        );
        if (!allowed) clear();
      })
      .catch(() => clear());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }
  return (
    <PartnerLayout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/items" element={<PartnerItemsPage />} />
        <Route path="/items/:id" element={<PartnerItemDetailPage />} />
        <Route path="/analytics" element={<PartnerAnalyticsPage />} />
        <Route path="/courier" element={<CourierJobsPage />} />
        <Route path="/tags/mint" element={<BulkMintTagsPage />} />
        <Route path="/redeem" element={<RedeemPointsPage />} />
        <Route path="/rewards-profile" element={<RewardsProfilePage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/notifications" element={<PartnerNotificationsPage />} />
        <Route path="/profile" element={<PartnerProfilePage />} />
        <Route path="/settings" element={<PartnerSettingsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </PartnerLayout>
  );
}
