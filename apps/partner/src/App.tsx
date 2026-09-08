import { Overview } from './pages/Overview.js';
import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';

import { api } from './lib/api.js';
import { useAuth } from './lib/auth.store.js';
import { PartnerLayout } from './components/PartnerLayout.js';
import { BulkMintTagsPage } from './pages/BulkMintTags.js';
import { CourierJobsPage } from './pages/CourierJobs.js';
import { LoginPage } from './pages/Login.js';
import { PartnerAnalyticsPage } from './pages/PartnerAnalytics.js';
import { PartnerItemsPage } from './pages/PartnerItems.js';
import { PartnerItemDetailPage } from './pages/PartnerItemDetail.js';
import { RedeemPointsPage } from './pages/RedeemPoints.js';
import { RewardsCatalogPage } from './pages/RewardsCatalog.js';
import { RecoveryPointPage } from './pages/RecoveryPoint.js';
import { RewardsProfilePage } from './pages/RewardsProfile.js';
import { BillingPage } from './pages/Billing.js';
import { PartnerNotificationsPage } from './pages/PartnerNotifications.js';
import { PartnerProfilePage } from './pages/PartnerProfile.js';
import { PartnerSettingsPage } from './pages/PartnerSettings.js';
import { NotFoundPage } from './pages/NotFound.js';

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
        <Route path="/reward-shop" element={<RewardsCatalogPage />} />
        <Route path="/recovery-point" element={<RecoveryPointPage />} />
        <Route path="/rewards-profile" element={<RewardsProfilePage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/notifications" element={<PartnerNotificationsPage />} />
        <Route path="/profile" element={<PartnerProfilePage />} />
        <Route path="/settings" element={<PartnerSettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </PartnerLayout>
  );
}
