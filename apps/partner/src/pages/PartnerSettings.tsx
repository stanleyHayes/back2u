import { useState, type ReactNode } from 'react';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import LockResetIcon from '@mui/icons-material/LockReset';
import { useMutation } from '@tanstack/react-query';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';

const INK = '#0B3D38';
const MARIGOLD = '#E0A106';

function SettingCard({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <Box sx={{ p: { xs: 2.5, md: 3 }, borderRadius: 3, border: '1px solid rgba(255,255,255,0.08)', bgcolor: 'background.paper' }}>
      <Typography sx={{ fontWeight: 700, fontSize: 16 }}>{title}</Typography>
      {desc && <Typography sx={{ color: 'text.secondary', fontSize: 14, mt: 0.5, mb: 2 }}>{desc}</Typography>}
      {children}
    </Box>
  );
}

export function PartnerSettingsPage() {
  const user = useAuth((s) => s.user);
  const clear = useAuth((s) => s.clear);
  const [sent, setSent] = useState(false);

  const reset = useMutation({
    mutationFn: () => api.requestPasswordReset(user!.email),
    onSuccess: () => setSent(true),
  });

  if (!user) return null;

  return (
    <Stack spacing={2.5} sx={{ maxWidth: 640 }}>
      <SettingCard title="Password" desc="We'll email you a secure link to set a new password.">
        {sent ? (
          <Alert severity="success">Reset link sent to {user.email}.</Alert>
        ) : (
          <Button
            onClick={() => reset.mutate()}
            disabled={reset.isPending}
            startIcon={<LockResetIcon />}
            variant="contained"
            sx={{ bgcolor: MARIGOLD, color: INK, borderRadius: 999, fontWeight: 700, '&:hover': { bgcolor: '#cf9305' } }}
          >
            {reset.isPending ? 'Sending…' : 'Send password reset email'}
          </Button>
        )}
        {reset.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {reset.error instanceof Error ? reset.error.message : 'Failed to send reset email'}
          </Alert>
        )}
      </SettingCard>

      <SettingCard title="Session" desc="Sign out of the partner portal on this device.">
        <Button onClick={clear} startIcon={<LogoutIcon />} variant="outlined" color="inherit" sx={{ borderRadius: 999, fontWeight: 700 }}>
          Sign out
        </Button>
      </SettingCard>
    </Stack>
  );
}
