import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { AdminLayout } from './components/AdminLayout.js';
import { api } from './lib/api.js';
import { useAuth } from './lib/auth.store.js';
import { AuditLogPage } from './pages/AuditLog.js';
import { InstitutionsPage } from './pages/Institutions.js';
import { InstitutionLeadsPage } from './pages/InstitutionLeads.js';
import { LoginPage } from './pages/Login.js';
import { MarketplaceCreatePage } from './pages/MarketplaceCreate.js';
import { OverviewPage } from './pages/Overview.js';
import { RedemptionsPage } from './pages/Redemptions.js';
import { ModerationQueuePage } from './pages/ModerationQueue.js';
import { SafetyReportsPage } from './pages/SafetyReports.js';
import { UsersPage } from './pages/Users.js';
import { VerificationsPage } from './pages/Verifications.js';
import { TrustedFinderApplicationsPage } from './pages/TrustedFinderApplications.js';
import { FeatureFlagsPage } from './pages/FeatureFlags.js';
import { AdminProfilePage } from './pages/AdminProfile.js';
import { AdminSettingsPage } from './pages/AdminSettings.js';

export function App() {
  const { user, clear } = useAuth();

  // Revalidate the persisted session once on mount: a stale/tampered
  // localStorage entry must not unlock the console.
  useEffect(() => {
    if (!user) return;
    api
      .me()
      .then((me) => {
        if (!me.roles.some((r) => r === 'admin' || r === 'super_admin')) clear();
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
    <AdminLayout>
      <Routes>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/verifications" element={<VerificationsPage />} />
        <Route path="/trusted-finder" element={<TrustedFinderApplicationsPage />} />
        <Route path="/marketplace" element={<MarketplaceCreatePage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/institutions" element={<InstitutionsPage />} />
        <Route path="/leads" element={<InstitutionLeadsPage />} />
        <Route path="/moderation" element={<ModerationQueuePage />} />
        <Route path="/safety" element={<SafetyReportsPage />} />
        <Route path="/redemptions" element={<RedemptionsPage />} />
        <Route path="/audit" element={<AuditLogPage />} />
        <Route path="/feature-flags" element={<FeatureFlagsPage />} />
        <Route path="/profile" element={<AdminProfilePage />} />
        <Route path="/settings" element={<AdminSettingsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AdminLayout>
  );
}
